# owner_panel/portal_fee/views.py
import logging
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings

from schools.models import School

logger = logging.getLogger(__name__)


def _call_school_api(school, endpoint, params=None, method="GET", json_data=None):
    """Make authenticated API call to a school's backend."""
    if not school.api_url or not school.api_url.strip():
        return None
    
    base_url = school.api_url.strip().rstrip('/')
    url = f"{base_url}/api/portal-fee/{endpoint}"
    
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
    except Exception as e:
        logger.error(f"Request error for {school.name}: {e}")
        return None


def _call_academic_api(school, endpoint, params=None):
    """Make authenticated API call to academic endpoint."""
    if not school.api_url:
        return None
    
    base_url = school.api_url.rstrip('/')
    url = f"{base_url}/api/academic/{endpoint}"
    
    headers = {
        "X-Owner-Secret": getattr(settings, "OWNER_API_SECRET", ""),
        "X-School-ID": school.school_id,
        "Content-Type": "application/json",
    }
    
    try:
        resp = requests.get(url, headers=headers, params=params, timeout=30)
        if resp.status_code == 200:
            return resp.json()
        return None
    except Exception as e:
        logger.error(f"Academic API error for {school.name}: {e}")
        return None


def _get_school_or_404(school_id):
    try:
        return School.objects.get(id=school_id)
    except School.DoesNotExist:
        return None


class OwnerPortalFeeOverviewView(APIView):
    """GET /api/portal-fee/overview/ - All-schools aggregate"""
    permission_classes = [IsAuthenticated]
    import traceback

    def get(self, request):
        schools = School.objects.filter(is_archived=False).order_by("name")
        
        school_summaries = []
        total_revenue = 0
        total_paid = 0
        total_pending = 0
        total_invoices = 0
        total_paid_invoices = 0
        
        for school in schools:
            try:
                if not school.api_url or not school.api_url.strip():
                    summary = {}
                else:
                    result = _call_school_api(school, "owner-summary/")
                    summary = result.get("summary", {}) if result else {}
                
                school_summaries.append({
                    "school_id": getattr(school, 'school_id', str(school.pk)),
                    "school_name": school.name,
                    "school_pk": school.pk,
                    "is_active": school.is_active,
                    "total_revenue": summary.get("total_revenue", 0) or 0,
                    "portal_paid_count": summary.get("portal_paid_count", 0) or 0,
                    "portal_pending_count": summary.get("portal_pending_count", 0) or 0,
                    "total_invoices": summary.get("total_invoices", 0) or 0,
                    "paid_invoices": summary.get("paid_invoices", 0) or 0,
                    "school_fee_amount": summary.get("school_fee_amount", 1000) or 1000,
                })
                
                total_revenue += summary.get("total_revenue", 0) or 0
                total_paid += summary.get("portal_paid_count", 0) or 0
                total_pending += summary.get("portal_pending_count", 0) or 0
                total_invoices += summary.get("total_invoices", 0) or 0
                total_paid_invoices += summary.get("paid_invoices", 0) or 0
                
            except Exception as e:
                tb = traceback.format_exc()
                print("OVERVIEW ERROR:\n", tb)
                return Response({'error': str(e), 'traceback': tb}, status=500)

        return Response({
            "success": True,
            "aggregate": {
                "total_schools": len(school_summaries),
                "total_revenue": total_revenue,
                "total_paid": total_paid,
                "total_pending": total_pending,
                "total_invoices": total_invoices,
                "paid_invoices": total_paid_invoices,
                "collection_rate": round(total_paid_invoices / total_invoices * 100, 1) if total_invoices else 0,
            },
            "schools": school_summaries,
        })


class OwnerPortalFeeSchoolSummaryView(APIView):
    """GET /api/portal-fee/school/<int:school_id>/summary/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, school_id):
        school = _get_school_or_404(school_id)
        if not school:
            return Response({"error": "School not found"}, status=404)
        
        # Get portal fee summary
        summary_result = _call_school_api(school, "owner-summary/")
        summary = summary_result.get("summary", {}) if summary_result else {}
        
        # Get sessions and terms from academic
        academic_result = _call_academic_api(school, "owner-sessions-terms/")
        if academic_result:
            sessions = academic_result.get("sessions", [])
            terms = academic_result.get("terms", [])
        else:
            sessions = []
            terms = []
        
        return Response({
            "success": True,
            "school": {
                "id": school.id,
                "name": school.name,
                "school_id": school.school_id,
                "is_active": school.is_active,
            },
            "summary": summary,
            "sessions": sessions,
            "terms": terms,
        })


class OwnerPortalFeeSessionsTermsView(APIView):
    """GET /api/portal-fee/school/<int:school_id>/sessions-terms/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, school_id):
        school = _get_school_or_404(school_id)
        if not school:
            return Response({"error": "School not found"}, status=404)
        
        result = _call_academic_api(school, "owner-sessions-terms/")
        if result:
            return Response({
                "success": True,
                "sessions": result.get("sessions", []),
                "terms": result.get("terms", []),
            })
        return Response({
            "success": True,
            "sessions": [],
            "terms": [],
        })


class OwnerPortalFeeInvoicesView(APIView):
    """GET /api/portal-fee/school/<int:school_id>/invoices/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, school_id):
        school = _get_school_or_404(school_id)
        if not school:
            return Response({"error": "School not found"}, status=404)
        
        result = _call_school_api(school, "owner-invoices/", params=request.GET)
        if result:
            return Response({
                "success": True,
                "results": result.get("results", []),
                "count": result.get("count", 0),
            })
        return Response({
            "success": True,
            "results": [],
            "count": 0,
        })


class OwnerPortalFeePaymentsView(APIView):
    """GET /api/portal-fee/school/<int:school_id>/payments/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, school_id):
        school = _get_school_or_404(school_id)
        if not school:
            return Response({"error": "School not found"}, status=404)
        
        result = _call_school_api(school, "owner-payments/", params=request.GET)
        if result:
            return Response({
                "success": True,
                "results": result.get("results", []),
                "count": result.get("count", 0),
            })
        return Response({
            "success": True,
            "results": [],
            "count": 0,
        })


class OwnerPortalFeeAccessView(APIView):
    """GET /api/portal-fee/school/<int:school_id>/access/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, school_id):
        school = _get_school_or_404(school_id)
        if not school:
            return Response({"error": "School not found"}, status=404)
        
        result = _call_school_api(school, "owner-access/", params=request.GET)
        if result:
            return Response({
                "success": True,
                "results": result.get("results", []),
                "count": result.get("count", 0),
            })
        return Response({
            "success": True,
            "results": [],
            "count": 0,
        })


class OwnerPortalFeeAnalyticsView(APIView):
    """GET /api/portal-fee/school/<int:school_id>/analytics/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, school_id):
        school = _get_school_or_404(school_id)
        if not school:
            return Response({"error": "School not found"}, status=404)
        
        result = _call_school_api(school, "owner-analytics/")
        if result:
            return Response({
                "success": True,
                "breakdown": result.get("breakdown", []),
            })
        return Response({
            "success": True,
            "breakdown": [],
        })


class OwnerPortalFeeSettingsView(APIView):
    """GET /api/portal-fee/school/<int:school_id>/settings/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, school_id):
        school = _get_school_or_404(school_id)
        if not school:
            return Response({"error": "School not found"}, status=404)
        
        result = _call_school_api(school, "owner-settings/")
        if result and result.get("settings"):
            return Response({
                "success": True,
                "settings": result["settings"],
            })
        return Response({
            "success": True,
            "settings": {"fee_amount": 1000, "is_active": True},
        })


class OwnerPortalFeeGlobalAnalyticsView(APIView):
    """GET /api/portal-fee/analytics/global/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        schools = School.objects.filter(is_archived=False).order_by("name")
        all_breakdown = []
        
        for school in schools:
            result = _call_school_api(school, "owner-analytics/")
            if result and result.get("breakdown"):
                for item in result["breakdown"]:
                    item["school_name"] = school.name
                    item["school_id"] = school.school_id
                    all_breakdown.append(item)
        
        all_breakdown.sort(key=lambda x: x.get("revenue", 0), reverse=True)
        
        return Response({
            "success": True,
            "breakdown": all_breakdown,
        })


class OwnerPortalFeeBulkGenerateView(APIView):
    """POST /api/portal-fee/bulk-generate/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        school_ids = request.data.get("school_ids", [])
        session_name = request.data.get("session_name", "")
        term_name = request.data.get("term_name", "")
        
        if not school_ids:
            schools = list(School.objects.filter(is_archived=False))
        else:
            schools = list(School.objects.filter(id__in=school_ids, is_archived=False))
        
        results = []
        success_count = 0
        
        for school in schools:
            result = _call_school_api(
                school, 
                "owner-generate-invoices/",
                method="POST",
                json_data={"session_name": session_name, "term_name": term_name}
            )
            
            if result and result.get("success"):
                success_count += 1
                results.append({
                    "school_id": school.school_id,
                    "school_name": school.name,
                    "success": True,
                    "created_count": result.get("created_count", 0),
                    "skipped_count": result.get("skipped_count", 0),
                    "message": result.get("message", ""),
                })
            else:
                results.append({
                    "school_id": school.school_id,
                    "school_name": school.name,
                    "success": False,
                    "error": result.get("error", "API call failed") if result else "No response from school",
                })
        
        return Response({
            "success": True,
            "message": f"Processed {len(schools)} schools, {success_count} succeeded",
            "success_count": success_count,
            "results": results,
        })