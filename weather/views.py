from rest_framework.decorators import api_view
from rest_framework.response import Response
import requests
import os
from dotenv import load_dotenv
load_dotenv()

API_KEY = os.getenv('WEATHER_API_KEY')
# API_KEY = ''

@api_view(['GET'])
def get_weather(request):
    city = request.GET.get('city', 'London')
    # Fetch Current
    curr_url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"
    curr_res = requests.get(curr_url)
    
    if curr_res.status_code != 200:
        return Response({'error': 'City not found'}, status=404)
    
    curr_data = curr_res.json()
    
    # Fetch Forecast using coordinates
    lat, lon = curr_data['coord']['lat'], curr_data['coord']['lon']
    for_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    for_data = requests.get(for_url).json()

    # The payload MUST match exactly what React expects
    return Response({
        "current": curr_data,
        "forecast": for_data['list'][:8],
        "city_info": for_data['city']
    })