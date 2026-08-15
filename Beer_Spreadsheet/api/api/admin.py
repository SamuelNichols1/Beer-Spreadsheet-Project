from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html

from api.api.models import Beer, BeerRating, Wine, WineRating, Cider, CiderRating, UserProfile


@admin.register(Beer)
class BeerAdmin(admin.ModelAdmin):
	list_display = ("id", "name", "brewery", "type", "style")


@admin.register(BeerRating)
class BeerRatingAdmin(admin.ModelAdmin):
	list_display = ("id", "beer", "user", "taste", "value", "texture", "packaging", "overall")

@admin.register(Wine)
class WineAdmin(admin.ModelAdmin):
	list_display = ("id", "name", "winery", "type", "style")


@admin.register(WineRating)
class WineRatingAdmin(admin.ModelAdmin):
	list_display = ("id", "wine", "user", "taste", "value", "sessionability", "packaging", "overall")


@admin.register(Cider)
class CiderAdmin(admin.ModelAdmin):
	list_display = ("id", "name", "brewery", "type", "style")


@admin.register(CiderRating)
class CiderRatingAdmin(admin.ModelAdmin):
	list_display = ("id", "cider", "user", "taste", "value", "texture", "packaging", "overall")



@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
	list_display = ("user", "color")
	list_editable = ("color",)


class UserProfileInline(admin.StackedInline):
	model = UserProfile
	can_delete = False
	extra = 0
	max_num = 1
	fields = ("color",)


class UserAdmin(BaseUserAdmin):
	list_display = BaseUserAdmin.list_display + ("profile_color",)
	inlines = (UserProfileInline,)

	@admin.display(description="Color")
	def profile_color(self, obj):
		color = getattr(getattr(obj, "profile", None), "color", "#7c5cff")
		return format_html(
			'<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:{};margin-right:6px;border:1px solid #bbb;"></span>{}',
			color,
			color,
		)


admin.site.unregister(User)
admin.site.register(User, UserAdmin)
