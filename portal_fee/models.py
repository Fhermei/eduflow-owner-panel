# owner_panel/portal_fee/models.py
from django.db import models
from schools.models import School


class PortalFeeOwnerSettings(models.Model):
    """Global portal fee settings for owner panel"""
    
    default_fee_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=1000,
        help_text="Default portal fee amount for new schools"
    )
    is_enabled = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Portal Fee Owner Setting'
        verbose_name_plural = 'Portal Fee Owner Settings'
    
    def __str__(self):
        return f"Portal Fee Settings - ₦{self.default_fee_amount}"


class PortalFeeSchoolConfig(models.Model):
    """Per-school portal fee configuration"""
    
    school = models.OneToOneField(
        School, 
        on_delete=models.CASCADE, 
        related_name='portal_fee_config'
    )
    fee_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=1000,
        help_text="Portal fee amount for this school"
    )
    is_active = models.BooleanField(default=True)
    custom_message = models.TextField(blank=True, help_text="Custom message for students/parents")
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Portal Fee School Config'
        verbose_name_plural = 'Portal Fee School Configs'
    
    def __str__(self):
        return f"{self.school.name} - ₦{self.fee_amount}"