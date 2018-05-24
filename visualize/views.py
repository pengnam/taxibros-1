from django.shortcuts import render
from daemons.models import Coordinate, Timestamp
from background_task.models import Task
from django.utils import timezone
from django.conf import settings
from django.http import JsonResponse
import datetime
import pytz
import math

def index(request):
    """View function for home page of site."""
    context = {
        "GOOGLEMAPS_SECRET_KEY": settings.GOOGLEMAPS_SECRET_KEY,
        "SLIDE_EVENT": settings.SLIDE_EVENT,
    }

    #CHECK1:If daemon is running
    if (Task.objects.all().count()==0):
        context["error_message"] = "Im sorry. The service appears to be experiencing a malfunction."

    #CHECK2:If there is insufficient data
    times = Timestamp.objects.filter(date_time__range = [timezone.now() - datetime.timedelta(minutes=5), timezone.now()])
    if (times.count()<5):
        context["error_message"] = "Data is still incomplete, please wait a few minutes before refreshing."

    return render(
        request,
        'visualize/index.html',
        context
    )


def gen_time_js(request):
    """Return Json of serialized list of coordinates according to time."""
    return JsonResponse({'coordinates': serialize_coordinates(get_coordinates_time(request))})

def gen_loc_js(request):
    """Return Json of serialized list of coordinates according to the location"""
    return JsonResponse({'coordinates': serialize_coordinates(get_coordinates_location(request))})


def maps_js(request):
    """Render Javascript file with list of coordinates in context."""
    return render(
        request,
        'visualize/maps.js',
        {'coordinates': serialize_coordinates(get_coordinates_time(request))}
    )

def get_coordinates_time(request):
    """Filter range one minute long, ensures at least one date_time returned.
    If two date_times returned, select most recent one.
    @param request: HTTP GET request containing other variables.
        minutes:
            predict taxi locations at this amount of time into the future.
            default: 0 (meaning now).
    @return list of coordinates.
    """
    minutes = request.GET.get('minutes')
    if minutes == None:
        minutes = 0

    # If true, minutes=0 means current time.
    # If false, minutes=0 means time of latest timestamp.
    if settings.HEATMAP_NOW:
        now = datetime.datetime.now(pytz.utc)
    else:
        now = Timestamp.objects.latest('date_time').date_time

    start_window = datetime.timedelta(minutes=int(minutes)+1)
    end_window = datetime.timedelta(minutes=int(minutes))
    times = Timestamp.objects.filter(
        date_time__range=(
            now - start_window,
            now - end_window
        ),
    )

    # If no times, return empty list.
    coordinates = []
    if times:
        # If many times, Select most recent time.
        time = times[0]
        coordinates = time.coordinate_set.all()
    return coordinates

def get_coordinates_location(request):
    lat = request.GET.get('lat')
    long = request.GET.get('long')
    #Approximating lat/long
    #http://www.longitudestore.com/how-big-is-one-gps-degree.html
    distFunc = lambda x: math.pow(math.pow(110570 * (x.lat - lat),2) + math.pow(111320(x.long - long),2),0.5)

    #Assumption: position passes on the coordinates
    now = Timestamp.objects.latest('date_time')
    coords = now.coordinate_set.all()

    result = []
    for coord in coords:
        if distFunc(coord) < 500:
            result.append(coord)
    return result





def serialize_coordinates(coordinates):
    """Helper function to serialize list to output as needed in JsonResponse.
    @return serialized list of coordinates.
    """
    return [[c.lat, c.long] for c in coordinates]
