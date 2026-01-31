from django.urls import path
from . import views

urlpatterns = [
    # This creates the endpoint: http://localhost:8000/api/weather
    path('weather', views.get_weather, name='get_weather'),
]