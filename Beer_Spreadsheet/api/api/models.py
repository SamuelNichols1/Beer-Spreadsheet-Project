from django.db import models

# Create your models here.
class Beer(models.Model):
    img = models.URLField(max_length=200, blank=True)
    brewery = models.CharField(max_length=100)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=100) # Choices
    style = models.CharField(max_length=100) # Choices

    def __str__(self):
        return f"{self.name} by {self.brewery}"

class Rating(models.Model):
    beer = models.ForeignKey(Beer, on_delete=models.DO_NOTHING, related_name="ratings")
    user = models.ForeignKey("auth.User", on_delete=models.DO_NOTHING)
    taste = models.IntegerField()
    value = models.IntegerField()
    texture = models.IntegerField()
    packaging = models.IntegerField()
    overall = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Rating for {self.beer.name}: {self.overall}"

class RatingSeen(models.Model):
    user = models.ForeignKey("auth.User", on_delete=models.CASCADE, related_name="seen_ratings")
    rating = models.ForeignKey(Rating, on_delete=models.CASCADE, related_name="seen_by")
    seen_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "rating")

    def __str__(self):
        return f"{self.user.username} saw rating {self.rating.id} at {self.seen_at}"

class UserProfile(models.Model):
    user = models.OneToOneField("auth.User", on_delete=models.CASCADE, related_name="profile")
    color = models.CharField(max_length=7, default="#7c5cff")

    def __str__(self):
        return f"Profile for {self.user.username}"