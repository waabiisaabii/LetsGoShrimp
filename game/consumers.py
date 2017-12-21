import re
import json
import logging
from channels import Group
from channels.sessions import channel_session
from game.models import *
from django.core import serializers

from channels.generic.websockets import WebsocketDemultiplexer
from channels.generic.websockets import WebsocketDemultiplexer, JsonWebsocketConsumer
from channels.sessions import channel_session, enforce_ordering
from channels.auth import channel_session_user, channel_session_user_from_http


class InfoConsumer(JsonWebsocketConsumer):

    channel_session_user = True

    # detect the connect, then default the users location
    def connect(self, message, multiplexer, **kwargs):
        # Send data with the multiplexer

        # multiplexer.send({"status": "I just connected!"})
        multiplexer.send({"x": 0, "y": 0})
        print('do something')
    # detect the channel close

    def disconnect(self, message, multiplexer, **kwargs):
        print("Stream %s is closed" % multiplexer.stream)

    # receive the info from server
    def receive(self, content, multiplexer, **kwargs):
        # Simple echo

        user_id = content['user_id']
        coord_x = content['coord_x']
        coord_y = content['coord_y']
        room_id = content['room_id']
        whether_win = content['winner']
        # print whether_win
        whether_lose = content['loser']
        # print whether_lose
        ready_flag = content['ready_flag']
        start_flag = content['start_flag']

        u = User.objects.get(id=user_id)
        i = Info.objects.get(player=u)

        i.current_location_x = coord_x
        i.current_location_y = coord_y

        i.win = whether_win
        # print i.win
        i.lose = whether_lose
        i.ready_flag = ready_flag
        i.start_flag = start_flag
        i.save()

        # get other user's location using State_two and room_id
        r = Room.objects.get(id=room_id)
        s = State_two.objects.get(room=r)

        # detect user leave the room
        if (i.ready_flag == 1):
            if (s.member.all().count() == 1):
                print("some one leave")
                i.lose = 1

                i.save()
        print(i.lose)

        # info_all = s.member.all()
        serialized_data = serializers.serialize("json", s.member.all())
        # multiplexer.send({"x": i.current_location_x, "y": i.current_location_y})
        multiplexer.send({"info_all": serialized_data})


class Demultiplexer(WebsocketDemultiplexer):
    consumers = {
        # "intval": InfoBinding.consumer,
        "intval": InfoConsumer,
    }

    # def connection_groups(self):
    #     return ["intval-updates"]
    groups = ["binding.values"]
