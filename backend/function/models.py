from typing import Optional

from pydantic import BaseModel

class Profile(BaseModel):
    name: str
    position: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None