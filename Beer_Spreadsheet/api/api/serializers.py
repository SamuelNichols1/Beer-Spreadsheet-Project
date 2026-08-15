from django.contrib.auth.models import Group, User
from api.api.models import Beer, BeerRating, Wine, WineRating, Cider, CiderRating
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    color = serializers.SerializerMethodField()

    def get_color(self, obj):
        profile = getattr(obj, "profile", None)
        if profile and profile.color:
            return profile.color
        return "#7c5cff"

    class Meta:
        model = User
        fields = ["id", "username", "email", "groups", "color"]


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name"]

class RateBeerInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, required=True)
    brewery = serializers.CharField(max_length=100, required=True)
    type = serializers.CharField(max_length=100, required=True)
    style = serializers.CharField(max_length=100, required=True)
    beer_id = serializers.IntegerField(required=False)
    taste = serializers.IntegerField(min_value=0, max_value=100, required=True)
    value = serializers.IntegerField(min_value=0, max_value=20, required=True)
    texture = serializers.IntegerField(min_value=0, max_value=10, required=True)
    packaging = serializers.IntegerField(min_value=0, max_value=5, required=True)


class BeerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Beer
        fields = ["id", "img", "brewery", "name", "type", "style"]


class BeerRatingSerializer(serializers.ModelSerializer):
    beer = BeerSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = BeerRating
        fields = ["id", "beer", "user", "taste", "value", "texture", "packaging", "overall", "created_at", "updated_at"]


class BeerRatingsSerializer(serializers.ModelSerializer):
    ratings = BeerRatingSerializer(many=True, read_only=True)

    class Meta:
        model = Beer
        fields = ["id", "img", "brewery", "name", "type", "style", "ratings"]



class RateWineInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, required=True)
    winery = serializers.CharField(max_length=100, required=True)
    type = serializers.CharField(max_length=100, required=True)
    style = serializers.CharField(max_length=100, required=True)
    wine_id = serializers.IntegerField(required=False)
    taste = serializers.IntegerField(min_value=0, max_value=100, required=True)
    value = serializers.IntegerField(min_value=0, max_value=20, required=True)
    sessionability = serializers.IntegerField(min_value=0, max_value=10, required=True)
    packaging = serializers.IntegerField(min_value=0, max_value=5, required=True)


class WineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wine
        fields = ["id", "img", "winery", "name", "type", "style"]


class WineRatingSerializer(serializers.ModelSerializer):
    wine = WineSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = WineRating
        fields = ["id", "wine", "user", "taste", "value", "sessionability", "packaging", "overall", "created_at", "updated_at"]


class WineRatingsSerializer(serializers.ModelSerializer):
    ratings = WineRatingSerializer(many=True, read_only=True)

    class Meta:
        model = Wine
        fields = ["id", "img", "winery", "name", "type", "style", "ratings"]


class RateCiderInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, required=True)
    brewery = serializers.CharField(max_length=100, required=True)
    type = serializers.CharField(max_length=100, required=True)
    style = serializers.CharField(max_length=100, required=True)
    cider_id = serializers.IntegerField(required=False)
    taste = serializers.IntegerField(min_value=0, max_value=100, required=True)
    value = serializers.IntegerField(min_value=0, max_value=20, required=True)
    texture = serializers.IntegerField(min_value=0, max_value=10, required=True)
    packaging = serializers.IntegerField(min_value=0, max_value=5, required=True)


class CiderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cider   
        fields = ["id", "img", "brewery", "name", "type", "style"]


class CiderRatingSerializer(serializers.ModelSerializer):
    cider = CiderSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = CiderRating
        fields = ["id", "cider", "user", "taste", "value", "texture", "packaging", "overall", "created_at", "updated_at"]


class CiderRatingsSerializer(serializers.ModelSerializer):
    ratings = CiderRatingSerializer(many=True, read_only=True)

    class Meta:
        model = Cider
        fields = ["id", "img", "brewery", "name", "type", "style", "ratings"]