import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, mean_absolute_error, mean_squared_error

class ModelAuditEngine:
    def __init__(self, y_true=None, y_pred=None, y_prob=None):
        self.y_true = y_true
        self.y_pred = y_pred
        self.y_prob = y_prob

    def compute_metrics(self):
        # Fallback to random data for demonstration if not provided
        if self.y_true is None:
            self.y_true = np.random.randint(0, 2, 100)
            self.y_pred = np.random.randint(0, 2, 100)
            self.y_prob = np.random.random(100)

        metrics = {
            "accuracy": accuracy_score(self.y_true, self.y_pred),
            "precision": precision_score(self.y_true, self.y_pred, zero_division=0),
            "recall": recall_score(self.y_true, self.y_pred, zero_division=0),
            "f_score": f1_score(self.y_true, self.y_pred, zero_division=0),
            "auc": roc_auc_score(self.y_true, self.y_prob),
            "mae": mean_absolute_error(self.y_true, self.y_pred),
            "mse": mean_squared_error(self.y_true, self.y_pred),
            "rmse": np.sqrt(mean_squared_error(self.y_true, self.y_pred))
        }
        
        # Artificial Wisdom Score calculation (Weighted average for now)
        weights = {
            "accuracy": 0.2,
            "precision": 0.2,
            "recall": 0.2,
            "f_score": 0.2,
            "auc": 0.2
        }
        
        wisdom_score = sum(metrics[k] * weights[k] for k in weights) * 100
        
        return {
            "raw_metrics": metrics,
            "wisdom_score": round(wisdom_score, 2)
        }

    def explainability_score(self):
        # Mock explainability score
        return 75.0

    def transparency_score(self):
        # Mock transparency score
        return 80.0
