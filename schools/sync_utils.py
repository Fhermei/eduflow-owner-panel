# owner_panel/schools/sync_utils.py
import sqlite3
import logging
from pathlib import Path
from django.utils import timezone
from decimal import Decimal
from .models import School, SchoolMetric

logger = logging.getLogger(__name__)

# Path to your Eduflow Backend directory where school databases are stored
SCHOOL_DB_PATH = Path("C:/Users/hp/Desktop/EDUFLOW BASIC/Eduflow Backend")


def sync_all_schools():
    """Sync metrics for all schools by reading SQLite files directly"""
    schools = School.objects.all()
    results = []
    
    for school in schools:
        result = sync_school_metrics_from_db(school)
        results.append({
            'school': school.name,
            'success': result,
            'db_path': str(SCHOOL_DB_PATH / f"{school.school_id}_db.sqlite3")
        })
    
    return results


def sync_school_metrics_from_db(school):
    """Sync metrics by reading the school's SQLite database directly"""
    try:
        import sqlite3  # Import here to ensure it's available
        
        # Construct the database file path
        db_file = SCHOOL_DB_PATH / f"{school.school_id}_db.sqlite3"
        
        print(f"Syncing {school.name} from: {db_file}")
        
        if not db_file.exists():
            print(f"⚠️ Database file not found for {school.name}: {db_file}")
            print(f"   Creating empty database file...")
            # Create an empty database file
            conn = sqlite3.connect(str(db_file))
            conn.close()
            print(f"✅ Created empty database file: {db_file}")
        
        # Now connect to the database (it exists, may be empty)
        conn = sqlite3.connect(str(db_file))
        cursor = conn.cursor()
        
        metrics_data = {
            'total_users': 0,
            'active_users': 0,
            'total_students': 0,
            'active_students': 0,
            'total_staff': 0,
            'active_staff': 0,
            'total_parents': 0,
            'total_admins': 0,
            'role_breakdown': {},
            'total_revenue': 0,
            'school_fee_revenue': 0,
            'portal_revenue': 0,
            'portal_paid_count': 0,
        }
        
        # Get user counts
        try:
            cursor.execute("SELECT COUNT(*) FROM users_user")
            result = cursor.fetchone()
            metrics_data['total_users'] = result[0] if result else 0
            
            cursor.execute("SELECT COUNT(*) FROM users_user WHERE is_active = 1")
            result = cursor.fetchone()
            metrics_data['active_users'] = result[0] if result else 0
        except Exception as e:
            print(f"  ⚠️ Users table error: {e}")
        
        # Get student counts
        try:
            cursor.execute("SELECT COUNT(*) FROM students_student")
            result = cursor.fetchone()
            metrics_data['total_students'] = result[0] if result else 0
            
            cursor.execute("SELECT COUNT(*) FROM students_student WHERE is_active = 1")
            result = cursor.fetchone()
            metrics_data['active_students'] = result[0] if result else 0
        except Exception as e:
            print(f"  ⚠️ Students table error: {e}")
        
        # Get staff counts
        try:
            cursor.execute("SELECT COUNT(*) FROM staff_staff")
            result = cursor.fetchone()
            metrics_data['total_staff'] = result[0] if result else 0
            
            cursor.execute("SELECT COUNT(*) FROM staff_staff WHERE is_active = 1")
            result = cursor.fetchone()
            metrics_data['active_staff'] = result[0] if result else 0
        except Exception as e:
            print(f"  ⚠️ Staff table error: {e}")
        
        # Get parent counts
        try:
            cursor.execute("SELECT COUNT(*) FROM parents_parent")
            result = cursor.fetchone()
            metrics_data['total_parents'] = result[0] if result else 0
        except Exception as e:
            print(f"  ⚠️ Parents table error: {e}")
        
        # Get role breakdown
        try:
            cursor.execute("SELECT role, COUNT(*) FROM users_user GROUP BY role")
            rows = cursor.fetchall()
            metrics_data['role_breakdown'] = {row[0]: row[1] for row in rows}
        except Exception as e:
            print(f"  ⚠️ Role breakdown error: {e}")
        
        # Get payment totals
        try:
            cursor.execute("SELECT SUM(amount) FROM payments_payment WHERE status = 'success'")
            result = cursor.fetchone()
            metrics_data['total_revenue'] = float(result[0]) if result and result[0] else 0
        except Exception as e:
            print(f"  ⚠️ Payments table error: {e}")
        
        # Get portal fee data
        try:
            cursor.execute("SELECT COUNT(*) FROM portal_fee_studentportalaccess WHERE has_paid = 1")
            result = cursor.fetchone()
            metrics_data['portal_paid_count'] = result[0] if result else 0
        except Exception as e:
            print(f"  ⚠️ Portal fee table error: {e}")
        
        # Count admin users
        try:
            admin_roles = ['head', 'hm', 'principal', 'vice_principal']
            placeholders = ','.join(['?'] * len(admin_roles))
            cursor.execute(f"SELECT COUNT(*) FROM users_user WHERE role IN ({placeholders})", admin_roles)
            result = cursor.fetchone()
            metrics_data['total_admins'] = result[0] if result else 0
        except Exception as e:
            print(f"  ⚠️ Admin count error: {e}")
        
        conn.close()
        
        print(f"✅ Found {metrics_data['total_users']} users, {metrics_data['total_students']} students for {school.name}")
        
        # Update or create metrics
        metric, created = SchoolMetric.objects.get_or_create(school=school)
        metric.total_users = metrics_data.get('total_users', 0)
        metric.active_users = metrics_data.get('active_users', 0)
        metric.total_students = metrics_data.get('total_students', 0)
        metric.active_students = metrics_data.get('active_students', 0)
        metric.total_staff = metrics_data.get('total_staff', 0)
        metric.active_staff = metrics_data.get('active_staff', 0)
        metric.total_parents = metrics_data.get('total_parents', 0)
        metric.total_admins = metrics_data.get('total_admins', 0)
        metric.role_breakdown = metrics_data.get('role_breakdown', {})
        metric.school_fee_revenue = Decimal(str(metrics_data.get('school_fee_revenue', 0)))
        metric.portal_revenue = Decimal(str(metrics_data.get('portal_revenue', 0)))
        metric.total_revenue = Decimal(str(metrics_data.get('total_revenue', 0)))
        metric.portal_paid_count = metrics_data.get('portal_paid_count', 0)
        metric.health_status = 'healthy' if metrics_data['total_users'] > 0 else 'unknown'
        metric.last_health_check = timezone.now()
        metric.error_message = ''
        metric.save()
        
        school.last_sync_at = timezone.now()
        school.save()
        
        return True
        
    except Exception as e:
        logger.error(f"Error syncing {school.name}: {e}")
        print(f"❌ Error syncing {school.name}: {e}")
        update_metric_down(school, str(e))
        return False


def update_metric_down(school, error_message):
    """Update metric to show school is down"""
    try:
        metric, created = SchoolMetric.objects.get_or_create(school=school)
        metric.health_status = 'down'
        metric.error_message = error_message[:500]
        metric.last_health_check = timezone.now()
        metric.save()
    except Exception as e:
        logger.error(f"Error updating metric for {school.name}: {e}")