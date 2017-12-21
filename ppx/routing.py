from channels.staticfiles import StaticFilesConsumer
from game import consumers

from channels import route_class, route
from game.consumers import Demultiplexer
from game.models import *

channel_routing = [
    route('http.request', StaticFilesConsumer()),
    route_class(Demultiplexer, path="^/ws/"),
    # route_class(Demultiplexer),
    # route('websocket.connect', consumers.ws_connect),
    # route('websocket.receive', consumers.ws_receive),
    # route('websocket.disconnect', consumers.ws_disconnect),
]