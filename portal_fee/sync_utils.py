"""
owner_panel/portal_fee/sync_utils.py

Fetches portal fee data from each school via HTTP API calls.
No direct database access - uses the school's own API with secret validation.
"""

import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def _call_school_api(school, endpoint, params=None, method="GET", json_data=None):
    """
    Make an authenticated API call to a school's backend.
    Uses the shared OWNER_API_SECRET for validation.
    """
    if not school.api_url:
        logger.warning(f"No API URL for school {school.name}")
        return None
    
    base_url = school.api_url.rstrip('/')
    url = f"{base_url}{endpoint}"
    
    headers = {
        "X-Owner-Secret": getattr(settings, "OWNER_API_SECRET", ""),
        "X-School-ID": school.school_id,
        "Content-Type": "application/json",
    }
    
    try:
        if method.upper() == "GET":
            resp = requests.get(url, headers=headers, params=params, timeout=30)
        elif method.upper() == "POST":
            resp = requests.post(url, headers=headers, json=json_data, timeout=30)
        else:
            return None
        
        if resp.status_code == 200:
            return resp.json()
        else:
            logger.error(f"API error for {school.name}: {resp.status_code} - {resp.text[:200]}")
            return None
            
    except requests.RequestException as e:
        logger.error(f"Request error for {school.name}: {e}")
        return None


def get_portal_fee_summary(school):
    """Get portal fee summary for a school via API"""
    result = _call_school_api(school, "/api/portal-fee/owner-summary/")
    if result:
        return result.get("summary", {})
    return {
        "total_invoices": 0,
        "paid_invoices": 0,
        "pending_invoices": 0,
        "cancelled_invoices": 0,
        "total_revenue": 0.0,
        "portal_paid_count": 0,
        "portal_pending_count": 0,
        "total_payments": 0,
        "success_payments": 0,
        "pending_payments": 0,
        "failed_payments": 0,
        "school_fee_amount": 0.0,
        "is_active": False,
    }


def get_portal_fee_invoices(school, session_id=None, term_id=None, status_filter=None, search=None, page=1, page_size=50):
    """Get paginated portal fee invoices via API"""
    params = {
        "page": page,
        "page_size": page_size,
    }
    if session_id:
        params["session_id"] = session_id
    if term_id:
        params["term_id"] = term_id
    if status_filter and status_filter != "all":
        params["status"] = status_filter
    if search:
        params["search"] = search
    
    result = _call_school_api(school, "/api/portal-fee/owner-invoices/", params=params)
    if result:
        return {
            "results": result.get("results", []),
            "count": result.get("count", 0),
        }
    return {"results": [], "count": 0}


def get_portal_fee_payments(school, status_filter=None, search=None, page=1, page_size=50):
    """Get paginated portal fee payments via API"""
    params = {
        "page": page,
        "page_size": page_size,
    }
    if status_filter and status_filter != "all":
        params["status"] = status_filter
    if search:
        params["search"] = search
    
    result = _call_school_api(school, "/api/portal-fee/owner-payments/", params=params)
    if result:
        return {
            "results": result.get("results", []),
            "count": result.get("count", 0),
        }
    return {"results": [], "count": 0}


def get_portal_fee_students_access(school, session_id=None, term_id=None, has_paid=None, search=None, page=1, page_size=50):
    """Get student portal access list via API"""
    params = {
        "page": page,
        "page_size": page_size,
    }
    if session_id:
        params["session_id"] = session_id
    if term_id:
        params["term_id"] = term_id
    if has_paid is not None:
        params["has_paid"] = "true" if has_paid else "false"
    if search:
        params["search"] = search
    
    result = _call_school_api(school, "/api/portal-fee/owner-access/", params=params)
    if result:
        return {
            "results": result.get("results", []),
            "count": result.get("count", 0),
        }
    return {"results": [], "count": 0}


def get_school_sessions_and_terms(school):
    """Get sessions and terms for a school via API"""
    result = _call_school_api(school, "/api/academic/owner-sessions-terms/")
    if result:
        return {
            "sessions": result.get("sessions", []),
            "terms": result.get("terms", []),
        }
    return {"sessions": [], "terms": []}


def get_portal_fee_analytics(school):
    """Get per-term analytics for a school via API"""
    result = _call_school_api(school, "/api/portal-fee/owner-analytics/")
    if result:
        return {"breakdown": result.get("breakdown", [])}
    return {"breakdown": []}


def get_portal_fee_settings(school):
    """Get portal fee settings for a school via API"""
    result = _call_school_api(school, "/api/portal-fee/owner-settings/")
    if result:
        return result.get("settings", {})
    return {"fee_amount": 1000, "is_active": True}


def generate_invoices_for_school(school, session_name, term_name):
    """Trigger invoice generation for a school via API"""
    result = _call_school_api(
        school, 
        "/api/portal-fee/owner-generate-invoices/", 
        method="POST",
        json_data={
            "session_name": session_name,
            "term_name": term_name,
        }
    )
    if result:
        return {
            "success": True,
            "created": result.get("created_count", 0),
            "skipped": result.get("skipped_count", 0),
            "message": result.get("message", ""),
        }
    return {"success": False, "error": "API call failed"}


def get_all_schools_portal_summary(schools):
    """Aggregate portal fee summary across all schools"""
    results = []
    for school in schools:
        summary = get_portal_fee_summary(school)
        results.append({
            "school_id": school.school_id,
            "school_name": school.name,
            "school_pk": school.pk,
            "is_active": school.is_active,
            **summary,
        })
    return results