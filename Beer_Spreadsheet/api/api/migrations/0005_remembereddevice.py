from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("api", "0004_cider_wine_rename_rating_beerrating_beerratingseen_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="RememberedDevice",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("token_hash", models.CharField(max_length=64, unique=True)),
                (
                    "fingerprint_hash",
                    models.CharField(
                        blank=True,
                        max_length=64,
                        null=True,
                        unique=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("last_used_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="remembered_devices",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]