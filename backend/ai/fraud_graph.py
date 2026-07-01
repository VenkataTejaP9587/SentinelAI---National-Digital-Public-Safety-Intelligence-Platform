import logging
import random
from typing import Dict, Any, List
from backend.config import settings

logger = logging.getLogger(__name__)

# Try to import neo4j driver
try:
    from neo4j import GraphDatabase
    NEO4J_DRIVER_AVAILABLE = True
except ImportError:
    NEO4J_DRIVER_AVAILABLE = False
    logger.warning("Neo4j python package not installed. Using mock graph engine.")

class FraudGraphClient:
    """
    Neo4j Fraud Relationship Graph Intelligence Client.
    Exposes graph-analytics endpoints for money mule tracking & network detection.
    """
    
    def __init__(self):
        self.driver = None
        if NEO4J_DRIVER_AVAILABLE:
            try:
                self.driver = GraphDatabase.driver(
                    settings.NEO4J_URI,
                    auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
                )
                # Quick ping
                self.driver.verify_connectivity()
                logger.info("Successfully connected to local Neo4j database.")
            except Exception as e:
                logger.warning(f"Could not connect to Neo4j database: {e}. Falling back to mock data.")
                self.driver = None

    def close(self):
        if self.driver:
            self.driver.close()

    async def get_fraud_ring_graph(self, ring_id: str = None) -> Dict[str, Any]:
        """
        Retrieves nodes and edges for a specific fraud ring cluster.
        If Neo4j driver or connection is offline, returns pre-configured mock graph structures.
        """
        if self.driver:
            try:
                with self.driver.session() as session:
                    # Cypher query to retrieve nodes & relations in subgraph
                    query = """
                    MATCH (n)-[r:LINKED_TO|TRANSFERRED_TO|REGISTERED_WITH]-(m)
                    RETURN n, r, m LIMIT 50
                    """
                    result = session.run(query)
                    nodes = []
                    links = []
                    seen_nodes = set()
                    
                    for record in result:
                        node_n = record["n"]
                        node_m = record["m"]
                        rel = record["r"]
                        
                        for node in [node_n, node_m]:
                            n_id = node.element_id
                            if n_id not in seen_nodes:
                                seen_nodes.add(n_id)
                                nodes.append({
                                    "id": n_id,
                                    "label": list(node.labels)[0] if node.labels else "Unknown",
                                    "properties": dict(node)
                                })
                                
                        links.append({
                            "source": node_n.element_id,
                            "target": node_m.element_id,
                            "type": rel.type,
                            "properties": dict(rel)
                        })
                    
                    if nodes:
                        return {"nodes": nodes, "links": links, "source": "Neo4j Database"}
            except Exception as e:
                logger.error(f"Neo4j query execution failed: {e}. Using mock engine.")

        # Fallback Mock Data representing a Digital Arrest scam network
        # Connects Suspects, Mule accounts, UPI IDs, SIM cards, IMEIs
        mock_nodes = [
            # Suspect / Core Ring Nodes
            {"id": "ACTOR-01", "type": "Suspect", "label": "Mule Ring Leader (Jamtara)", "risk": "critical", "details": "Linked to 14 cases"},
            {"id": "PHONE-9876543210", "type": "Phone", "label": "+91 98765 43210", "risk": "critical", "details": "Spoofed TRAI Caller ID"},
            {"id": "PHONE-9988776655", "type": "Phone", "label": "+91 99887 76655", "risk": "high", "details": "Associated mule coordinator"},
            {"id": "IMEI-847291048", "type": "Device", "label": "IMEI: 862590214872910", "risk": "critical", "details": "Used for 4 different SIM cards"},
            
            # Mule Accounts
            {"id": "BANK-SBI-098", "type": "Bank_Account", "label": "SBI A/c *8904 (Mule)", "risk": "critical", "details": "₹42 Lakhs credits in 3 days"},
            {"id": "BANK-HDFC-214", "type": "Bank_Account", "label": "HDFC A/c *1124 (Mule)", "risk": "high", "details": "Linked to cardless withdrawal"},
            {"id": "UPI-mule1@okaxis", "type": "UPI_ID", "label": "mule1@okaxis", "risk": "critical", "details": "Scam payment receiver"},
            {"id": "UPI-rentpay@okhdfc", "type": "UPI_ID", "label": "rentpay@okhdfc", "risk": "medium", "details": "Secondary money routing ID"},
            
            # Victims
            {"id": "VICTIM-Rao", "type": "Victim", "label": "S. Rao (Mumbai)", "risk": "low", "details": "Lost ₹15,50,000 on Digital Arrest threat"},
            {"id": "VICTIM-Kaur", "type": "Victim", "label": "P. Kaur (Amritsar)", "risk": "low", "details": "Lost ₹2,10,000 via phishing link"},
        ]

        mock_links = [
            # Call/Contact relationships
            {"source": "PHONE-9876543210", "target": "VICTIM-Rao", "type": "CALLED", "details": "Pretended to be CBI Office"},
            {"source": "PHONE-9988776655", "target": "VICTIM-Kaur", "type": "SMS_SENT", "details": "Sent lottery scam link"},
            
            # Device logins
            {"source": "PHONE-9876543210", "target": "IMEI-847291048", "type": "REGISTERED_ON", "details": "SIM card inserted"},
            {"source": "PHONE-9988776655", "target": "IMEI-847291048", "type": "REGISTERED_ON", "details": "SIM card swapped"},
            
            # Direct money flow
            {"source": "VICTIM-Rao", "target": "UPI-mule1@okaxis", "type": "TRANSFERRED_TO", "details": "₹15,50,000 via Immediate RTGS"},
            {"source": "VICTIM-Kaur", "target": "UPI-rentpay@okhdfc", "type": "TRANSFERRED_TO", "details": "₹2,10,000 via UPI QR Code"},
            
            # Mule account consolidation
            {"source": "UPI-mule1@okaxis", "target": "BANK-SBI-098", "type": "LINKS_TO", "details": "Associated Virtual Address"},
            {"source": "UPI-rentpay@okhdfc", "target": "BANK-HDFC-214", "type": "LINKS_TO", "details": "Associated Virtual Address"},
            {"source": "BANK-SBI-098", "target": "BANK-HDFC-214", "type": "LAUNDERED_TO", "details": "₹8,00,000 shell transfer"},
            
            # Association to ring leader
            {"source": "BANK-SBI-098", "target": "ACTOR-01", "type": "CONTROLLED_BY", "details": "Netbanking accessed via device"},
            {"source": "BANK-HDFC-214", "target": "ACTOR-01", "type": "CONTROLLED_BY", "details": "ATM withdrawals near Jamtara"},
        ]
        
        return {
            "nodes": mock_nodes,
            "links": mock_links,
            "source": "Mock Graph Engine (Database Connection Offline)"
        }

    async def verify_entity(self, entity_type: str, value: str) -> Dict[str, Any]:
        """
        Check if a particular phone number, UPI ID, or bank account is flagged.
        """
        # Connect & query if active
        if self.driver:
            try:
                with self.driver.session() as session:
                    # Cypher query checking node status
                    query = f"MATCH (n:{entity_type.capitalize()} {{value: $val}}) RETURN n.is_flagged as is_flagged, n.risk_score as score"
                    result = session.run(query, val=value)
                    record = result.single()
                    if record:
                        return {
                            "is_flagged": record["is_flagged"],
                            "risk_score": float(record["score"]),
                            "source": "Neo4j"
                        }
            except Exception as e:
                logger.error(f"Neo4j verify query error: {e}")
                
        # Fallback logic
        flagged_values = ["9876543210", "mule1@okaxis", "12345678904", "https://sbi-verify.net"]
        is_flagged = value in flagged_values or any(val in value for val in flagged_values)
        
        return {
            "is_flagged": is_flagged,
            "risk_score": 94.0 if is_flagged else random.uniform(5.0, 24.0),
            "cases_count": 7 if is_flagged else 0,
            "in_ring": is_flagged,
            "source": "Mock Graph Engine"
        }
