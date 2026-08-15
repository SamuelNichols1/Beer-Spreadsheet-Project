"""
URL configuration for api project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
]

from django.urls import include, path
from rest_framework import routers

from api.api import views

router = routers.DefaultRouter()
router.register(r"users", views.UserViewSet)
router.register(r"groups", views.GroupViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path('admin/', admin.site.urls),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
    path("api-token-auth/", obtain_auth_token, name="api_token_auth"),
    path("csrf/", views.csrf, name="csrf"),
    path("rate_beer/", views.rate_beer, name="rate_beer"),
    path("rate_wine/", views.rate_wine, name="rate_wine"),
    path("rate_cider/", views.rate_cider, name="rate_cider"),
    path("my-color/", views.my_color, name="my_color"),
    path("beers/", views.get_beer_list, name="get_beer_list"),
    path("beers_with_ratings/", views.get_beer_list_with_ratings, name="get_beer_list_with_ratings"),
    path("beers_with_average_ratings/", views.get_beer_list_with_average_ratings, name="get_beer_list_with_average_ratings"),
    path("wines/", views.get_wine_list, name="get_wine_list"),
    path("wines_with_ratings/", views.get_wine_list_with_ratings, name="get_wine_list_with_ratings"),
    path("wines_with_average_ratings/", views.get_wine_list_with_average_ratings, name="get_wine_list_with_average_ratings"),
    path("ciders/", views.get_cider_list, name="get_cider_list"),
    path("ciders_with_ratings/", views.get_cider_list_with_ratings, name="get_cider_list_with_ratings"),
    path("ciders_with_average_ratings/", views.get_cider_list_with_average_ratings, name="get_cider_list_with_average_ratings"),
    path("unseen_beer_ratings/", views.unseen_beer_ratings, name="unseen_beer_ratings"),
    path("unseen_cider_ratings/", views.unseen_cider_ratings, name="unseen_cider_ratings"),
    path("unseen_wine_ratings/", views.unseen_wine_ratings, name="unseen_wine_ratings"),
]
