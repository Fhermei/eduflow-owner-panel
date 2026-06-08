# owner_panel/academic/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from schools.models import School
import requests


class AcademicSessionsProxyView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        school_id = request.query_params.get('school_id')
        if not school_id:
            return Response({'results': []})
        
        try:
            school = School.objects.get(school_id=school_id)
            api_url = school.api_url.rstrip('/')
            secret = getattr(settings, 'OWNER_API_SECRET', '')
            
            response = requests.get(
                f"{api_url}/api/academic/sessions/",
                headers={
                    'X-Owner-Secret': secret,
                    'X-School-Id': school_id,
                },
                timeout=10
            )
            
            if response.status_code == 200:
                return Response(response.json())
            return Response({'results': []})
        except Exception:
            return Response({'results': []})


class AcademicTermsProxyView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        school_id = request.query_params.get('school_id')
        if not school_id:
            return Response({'results': []})
        
        try:
            school = School.objects.get(school_id=school_id)
            api_url = school.api_url.rstrip('/')
            secret = getattr(settings, 'OWNER_API_SECRET', '')
            
            response = requests.get(
                f"{api_url}/api/academic/terms/",
                headers={
                    'X-Owner-Secret': secret,
                    'X-School-Id': school_id,
                },
                timeout=10
            )
            
            if response.status_code == 200:
                return Response(response.json())
            return Response({'results': []})
        except Exception:
            return Response({'results': []})