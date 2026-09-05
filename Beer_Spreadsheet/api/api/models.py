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

class BeerRating(models.Model):
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

class BeerRatingSeen(models.Model):
    user = models.ForeignKey("auth.User", on_delete=models.CASCADE, related_name="seen_beer_ratings")
    rating = models.ForeignKey(BeerRating, on_delete=models.CASCADE, related_name="seen_by")
    seen_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "rating")

    def __str__(self):
        return f"{self.user.username} saw rating {self.rating.id} at {self.seen_at}"

class Wine(models.Model):
    img = models.URLField(max_length=200, blank=True)
    winery = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    region = models.CharField(max_length=100, blank=True)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=100) # Choices
    style = models.CharField(max_length=100) # Choices

    def __str__(self):
        return f"{self.name} - {self.style}, {self.country}"

class WineRating(models.Model):
    wine = models.ForeignKey(Wine, on_delete=models.DO_NOTHING, related_name="ratings")
    user = models.ForeignKey("auth.User", on_delete=models.DO_NOTHING)
    taste = models.IntegerField()
    value = models.IntegerField()
    sessionability = models.IntegerField()
    packaging = models.IntegerField()
    overall = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Rating for {self.wine.name}: {self.overall}"

class WineRatingSeen(models.Model):
    user = models.ForeignKey("auth.User", on_delete=models.CASCADE, related_name="seen_wine_ratings")
    rating = models.ForeignKey(WineRating, on_delete=models.CASCADE, related_name="seen_by")
    seen_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "rating")

    def __str__(self):
        return f"{self.user.username} saw rating {self.rating.id} at {self.seen_at}"


class Cider(models.Model):
    img = models.URLField(max_length=200, blank=True)
    brewery = models.CharField(max_length=100)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=100) # Choices
    style = models.CharField(max_length=100) # Choices

    def __str__(self):
        return f"{self.name} by {self.brewery}"

class CiderRating(models.Model):
    cider = models.ForeignKey(Cider, on_delete=models.DO_NOTHING, related_name="ratings")
    user = models.ForeignKey("auth.User", on_delete=models.DO_NOTHING)
    taste = models.IntegerField()
    value = models.IntegerField()
    texture = models.IntegerField()
    packaging = models.IntegerField()
    overall = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Rating for {self.cider.name}: {self.overall}"

class CiderRatingSeen(models.Model):
    user = models.ForeignKey("auth.User", on_delete=models.CASCADE, related_name="seen_cider_ratings")
    rating = models.ForeignKey(CiderRating, on_delete=models.CASCADE, related_name="seen_by")
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


class RememberedDevice(models.Model):
    user = models.ForeignKey("auth.User", on_delete=models.CASCADE, related_name="remembered_devices")
    token_hash = models.CharField(max_length=64, unique=True)
    fingerprint_hash = models.CharField(max_length=64, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Remembered device for {self.user.username}"

