import sqlite3
from pathlib import Path
from datetime import datetime
from django.core.management.base import BaseCommand
from schools.models import School, ActivityLog

class Command(BaseCommand):
    help = 'Sync all existing activities from school databases to owner panel'
    
    def handle(self, *args, **options):
        MAIN_BACKEND_DIR = Path("C:/Users/hp/Desktop/EDUFLOW BASIC/Eduflow Backend")
        schools = School.objects.filter(is_archived=False)
        
        total_synced = 0
        
        for school in schools:
            db_path = MAIN_BACKEND_DIR / f"{school.school_id}_db.sqlite3"
            if not db_path.exists():
                self.stdout.write(f"Database not found for {school.name}")
                continue
            
            try:
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                
                # Check if activity table exists
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users_activity'")
                if not cursor.fetchone():
                    conn.close()
                    continue
                
                # Get all activities not yet synced
                cursor.execute("""
                    SELECT id, activity_type, action, description, user_name, 
                           user_registration_number, ip_address, created_at
                    FROM users_activity
                    ORDER BY created_at DESC
                """)
                
                rows = cursor.fetchall()
                synced_count = 0
                
                for row in rows:
                    # Check if already exists in owner panel
                    exists = ActivityLog.objects.filter(
                        school=school,
                        action=row[2],
                        description=row[3],
                        created_at=row[7]
                    ).exists()
                    
                    if not exists:
                        ActivityLog.objects.create(
                            school=school,
                            action=row[2],
                            description=row[3] or '',
                            user=row[4] or 'System',
                            user_registration_number=row[5] or '',
                            ip_address=row[6] or '',
                            created_at=datetime.fromisoformat(row[7]) if row[7] else timezone.now(),
                            metadata={'original_id': row[0], 'activity_type': row[1]}
                        )
                        synced_count += 1
                
                total_synced += synced_count
                self.stdout.write(f"Synced {synced_count} activities from {school.name}")
                conn.close()
                
            except Exception as e:
                self.stdout.write(f"Error syncing {school.name}: {e}")
        
        self.stdout.write(self.style.SUCCESS(f"Total activities synced: {total_synced}"))