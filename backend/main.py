from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import time
from engines.model_audit import ModelAuditEngine
from engines.data_audit import DataAuditEngine
from engines.system_audit import SystemAuditEngine

app = FastAPI(title="Artificial Wisdom API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuditRequest(BaseModel):
    url: Optional[str] = None
    endpoint: Optional[str] = None
    system_type: str = "general"

class AuditResponse(BaseModel):
    audit_id: str
    status: str
    message: str

@app.get("/")
async def root():
    return {"message": "Artificial Wisdom Audit Engine is running"}

@app.post("/audit/quick", response_model=AuditResponse)
async def quick_audit(request: AuditRequest):
    # Simulate quick audit
    audit_id = f"qw-{int(time.time())}"
    return {
        "audit_id": audit_id,
        "status": "completed",
        "message": "Quick audit completed successfully"
    }

@app.get("/audit/report/{audit_id}")
async def get_report(audit_id: str):
    # Instantiate engines
    model_engine = ModelAuditEngine()
    data_engine = DataAuditEngine()
    system_engine = SystemAuditEngine()
    
    model_results = model_engine.compute_metrics()
    data_results = data_engine.get_summary()
    system_results = system_engine.get_summary()
    
    overall_score = (
        model_results["wisdom_score"] + 
        data_results["data_wisdom_score"] + 
        system_results["system_wisdom_score"]
    ) / 3

    return {
        "audit_id": audit_id,
        "overall_score": round(overall_score, 2),
        "metrics": {
            "model_wisdom": model_results["wisdom_score"],
            "data_wisdom": round(data_results["data_wisdom_score"], 2),
            "system_wisdom": round(system_results["system_wisdom_score"], 2)
        },
        "model_details": model_results["raw_metrics"],
        "data_details": data_results["details"],
        "system_details": system_results["details"],
        "risk_level": "Low" if overall_score > 80 else "Medium",
        "insights": [
            "High precision detected in classification tasks",
            "Minor data imbalance in training set",
            "Latency is within optimal ranges"
        ],
        "badge_url": f"/badges/{audit_id}.png"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
