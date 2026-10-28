from typing import Dict, Any, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.ai_audit import AIAudit

def calculate_diff(ai_output: Dict[str, Any], human_output: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
    """
    So sánh kết quả AI ban đầu và kết quả con người sửa đổi.
    Trả về (is_modified, diff_summary)
    """
    diff = {}
    is_modified = False

    all_keys = set(ai_output.keys()).union(set(human_output.keys()))
    for key in all_keys:
        val_ai = ai_output.get(key)
        val_human = human_output.get(key)
        if val_ai != val_human:
            is_modified = True
            diff[key] = {
                "ai_suggested": val_ai,
                "human_changed": val_human
            }

    return is_modified, diff

async def log_ai_action(
    db: AsyncSession,
    module_name: str,
    user_id: str,
    parsed_output: Dict[str, Any],
    project_id: Optional[str] = None,
    ai_prompt_sent: Optional[str] = None,
    ai_raw_response: Optional[str] = None,
    confidence_score: float = 1.0,
    human_final_output: Optional[Dict[str, Any]] = None,
    latency_ms: int = 0,
    cost_usd: float = 0.0
) -> AIAudit:
    """
    Ghi nhận một bản ghi nhật ký bất biến vào cơ sở dữ liệu.
    Không hỗ trợ update hay xóa đối với bảng này.
    """
    is_modified = False
    diff_summary = {}

    if human_final_output is not None:
        is_modified, diff_summary = calculate_diff(parsed_output, human_final_output)

    audit_entry = AIAudit(
        module_name=module_name,
        user_id=user_id,
        project_id=project_id,
        ai_prompt_sent=ai_prompt_sent,
        ai_raw_response=ai_raw_response,
        parsed_output=parsed_output,
        confidence_score=confidence_score,
        human_final_output=human_final_output or parsed_output,
        is_modified=is_modified,
        diff_summary=diff_summary,
        latency_ms=latency_ms,
        cost_usd=cost_usd
    )

    db.add(audit_entry)
    await db.commit()
    await db.refresh(audit_entry)
    return audit_entry
