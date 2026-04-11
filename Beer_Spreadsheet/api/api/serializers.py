from django.contrib.auth.models import Group, User
from api.api.models import Beer, Rating
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


class RatingSerializer(serializers.ModelSerializer):
    beer = BeerSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Rating
        fields = ["id", "beer", "user", "taste", "value", "texture", "packaging", "overall", "created_at", "updated_at"]


class BeerRatingsSerializer(serializers.ModelSerializer):
    ratings = RatingSerializer(many=True, read_only=True)

    class Meta:
        model = Beer
        fields = ["id", "img", "brewery", "name", "type", "style", "ratings"]