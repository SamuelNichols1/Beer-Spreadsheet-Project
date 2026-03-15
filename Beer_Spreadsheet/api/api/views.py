from django.contrib.auth.models import Group, User
from django.http import JsonResponse
from django.db.models import Avg, FloatField, Prefetch, Q, Value
from django.db.models.functions import Coalesce
from django.middleware.csrf import get_token
from api.api.models import Beer, Rating, UserProfile
from api.api.tools import calculate_overall_rating
from rest_framework import permissions, viewsets
from rest_framework.decorators import api_view, permission_classes
import re

from api.logger import get_logger
from api.api.serializers import BeerRatingsSerializer, BeerSerializer, GroupSerializer, RateBeerInputSerializer, UserSerializer

logger = get_logger(__name__)


def capitalize_words(value):
    if not isinstance(value, str):
        return value
    return re.sub(r"(^|[\s\-'])([a-z])", lambda match: f"{match.group(1)}{match.group(2).upper()}", value.strip())


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def csrf(request):
    return JsonResponse({"csrfToken": get_token(request)})


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """

    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        for user in self.get_queryset():
            UserProfile.objects.get_or_create(user=user)
        logger.info("User list requested by %s", request.user)
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        logger.info("User retrieve requested by %s for id=%s", request.user, kwargs.get("pk"))
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        logger.info("User create requested by %s", request.user)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        logger.info("User update requested by %s for id=%s", request.user, kwargs.get("pk"))
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        logger.info("User delete requested by %s for id=%s", request.user, kwargs.get("pk"))
        return super().destroy(request, *args, **kwargs)


class GroupViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """

    queryset = Group.objects.all().order_by("name")
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        logger.info("Group list requested by %s", request.user)
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        logger.info("Group retrieve requested by %s for id=%s", request.user, kwargs.get("pk"))
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        logger.info("Group create requested by %s", request.user)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        logger.info("Group update requested by %s for id=%s", request.user, kwargs.get("pk"))
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        logger.info("Group delete requested by %s for id=%s", request.user, kwargs.get("pk"))
        return super().destroy(request, *args, **kwargs)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def rate_beer(request):
    serializer = RateBeerInputSerializer(data=request.data)
    if not serializer.is_valid():
        return JsonResponse({"detail": "Invalid data", "errors": serializer.errors}, status=400)

    name = capitalize_words(request.data.get("name") or "")
    brewery = capitalize_words(request.data.get("brewery") or "")
    beer_type = request.data.get("type")
    style = request.data.get("style")
    taste = request.data.get("taste")
    value = request.data.get("value")
    texture = request.data.get("texture")
    packaging = request.data.get("packaging")

    try:
        taste = int(taste)
        value = int(value)
        texture = int(texture)
        packaging = int(packaging)
    except (TypeError, ValueError):
        return JsonResponse({"detail": "Scores must be numbers."}, status=400)

    if not (0 <= taste <= 100 and 0 <= value <= 20 and 0 <= texture <= 10 and 0 <= packaging <= 5):
        return JsonResponse({"detail": "One or more scores are out of range."}, status=400)

  
    if not all([name, brewery, beer_type, style]):
        return JsonResponse({"detail": "name, brewery, type and style are required when beer_id is not provided."}, status=400)

    beer, created = Beer.objects.get_or_create(
        name=name,
        brewery=brewery,
        type=beer_type,
        style=style,
    )

    response_message = None
    if created:
        logger.info("Created new beer: %s by %s", name, brewery)
        response_message = f"Beer '{name}' by '{brewery}' created"

    overall = calculate_overall_rating(taste, value, texture, packaging)

    # Check if the user has already rated this beer
    existing_rating = Rating.objects.filter(beer=beer, user=request.user).first()
    if existing_rating:
        existing_rating.taste = taste
        existing_rating.value = value
        existing_rating.texture = texture
        existing_rating.packaging = packaging
        existing_rating.overall = overall
        existing_rating.save(update_fields=["taste", "value", "texture", "packaging", "overall"])
        if response_message:
            response_message += " and "
        response_message += f"Updated rating for beer '{name}' by '{brewery}' successfully."
    else:
        Rating.objects.create(
            beer=beer,
            user=request.user,
            taste=taste,
            value=value,
            texture=texture,
            packaging=packaging,
            overall=overall,
        )
        if response_message:
            response_message += " and "
        response_message += f"Rating for beer '{name}' by '{brewery}' saved successfully"

    return JsonResponse({"detail": response_message})

@api_view(["GET"])
@permission_classes([permissions.AllowAny])    
def get_beer_list(request):
    beers = Beer.objects.all()
    serializer = BeerSerializer(beers, many=True)
    return JsonResponse(serializer.data, safe=False)

@api_view(["GET"])
@permission_classes([permissions.AllowAny])    
def get_beer_list_with_ratings(request):
    beers = Beer.objects.all().prefetch_related("ratings")

    serializer = BeerRatingsSerializer(beers, many=True)
    return JsonResponse(serializer.data, safe=False)

@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def get_beer_list_with_average_ratings(request):
    users = request.query_params.getlist("users")

    user_filter = Q()
    if users:
        user_filter = Q(ratings__user__username__in=users)

    ratings_queryset = Rating.objects.select_related("user")
    if users:
        ratings_queryset = ratings_queryset.filter(user__username__in=users)

    beers = Beer.objects.annotate(
        avg_taste=Coalesce(Avg("ratings__taste", filter=user_filter), Value(0.0), output_field=FloatField()),
        avg_value=Coalesce(Avg("ratings__value", filter=user_filter), Value(0.0), output_field=FloatField()),
        avg_texture=Coalesce(Avg("ratings__texture", filter=user_filter), Value(0.0), output_field=FloatField()),
        avg_packaging=Coalesce(Avg("ratings__packaging", filter=user_filter), Value(0.0), output_field=FloatField()),
        avg_overall=Coalesce(Avg("ratings__overall", filter=user_filter), Value(0.0), output_field=FloatField()),
    ).prefetch_related(Prefetch("ratings", queryset=ratings_queryset, to_attr="filtered_ratings"))

    data = [
        {
            "id": beer.id,
            "img": beer.img,
            "brewery": beer.brewery,
            "name": beer.name,
            "type": beer.type,
            "style": beer.style,
            "avg_taste": beer.avg_taste,
            "avg_value": beer.avg_value,
            "avg_texture": beer.avg_texture,
            "avg_packaging": beer.avg_packaging,
            "avg_overall": beer.avg_overall,
            "rated_by": sorted({rating.user.username for rating in getattr(beer, "filtered_ratings", [])}),
        }
        for beer in beers
    ]
    return JsonResponse(data, safe=False)


@api_view(["GET", "PATCH"])
@permission_classes([permissions.IsAuthenticated])
def my_color(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if request.method == "GET":
        return JsonResponse({"username": request.user.username, "color": profile.color})

    color = request.data.get("color")
    if not isinstance(color, str) or not re.match(r"^#[0-9a-fA-F]{6}$", color):
        return JsonResponse({"detail": "Color must be a hex value like #7c5cff"}, status=400)

    profile.color = color.lower()
    profile.save(update_fields=["color"])
    return JsonResponse({"username": request.user.username, "color": profile.color})