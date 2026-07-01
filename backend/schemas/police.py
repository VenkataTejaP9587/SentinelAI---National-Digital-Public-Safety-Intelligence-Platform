from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class GraphNode(BaseModel):
    id: str
    type: str
    label: str
    risk: str
    details: Optional[str]

class GraphLink(BaseModel):
    source: str
    target: str
    type: str
    details: Optional[str]

class NetworkGraphResponse(BaseModel):
    nodes: List[GraphNode]
    links: List[GraphLink]
    source: str

class LiveAlertFeed(BaseModel):
    level: str
    msg: str
    time: str

class GeoHotspot(BaseModel):
    lat: float
    lng: float
    weight: float
    scam_type: str
    district: str
    state: str
