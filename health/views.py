import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from schools.models import School


class HealthCheckView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        print("Health check requested")
        results = []
        
        schools = School.objects.filter(is_active=True)
        print(f"Found {schools.count()} active schools")
        
        for school in schools:
            print(f"Checking school: {school.name} at {school.api_url}")
            health_url = f"{school.api_url}/api/owner-health/"
            
            try:
                response = requests.get(
                    health_url,
                    headers={'X-Owner-Secret': settings.OWNER_API_SECRET},
                    timeout=5
                )
                
                if response.status_code == 200:
                    data = response.json()
                    results.append({
                        'school_id': school.school_id,
                        'name': school.name,
                        'status': 'healthy',
                        'ping_ms': data.get('default_db_ping_ms', 0),
                        'memory_mb': data.get('memory_mb', 0),
                    })
                    print(f"  ✓ {school.name} is healthy")
                else:
                    results.append({
                        'school_id': school.school_id,
                        'name': school.name,
                        'status': 'unhealthy',
                        'error': f"HTTP {response.status_code}"
                    })
                    print(f"  ✗ {school.name} returned {response.status_code}")
                    
            except requests.RequestException as e:
                results.append({
                    'school_id': school.school_id,
                    'name': school.name,
                    'status': 'down',
                    'error': str(e)
                })
                print(f"  ✗ {school.name} is down: {str(e)}")
        
        return Response({
            'total_schools': len(results),
            'healthy': sum(1 for r in results if r['status'] == 'healthy'),
            'unhealthy': sum(1 for r in results if r['status'] == 'unhealthy'),
            'down': sum(1 for r in results if r['status'] == 'down'),
            'schools': results
        })