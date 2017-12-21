from __future__ import unicode_literals
from django.db import models
from django.contrib.auth.models import User
# Create your models here.

from channels.binding.websockets import WebsocketBinding


class Game_user(models.Model):
    user = models.OneToOneField(User,
                                on_delete=models.CASCADE,
                                primary_key=True)

    character = models.ImageField(upload_to='user_character', blank=True)
    # User can have many different character to play the game
    # eg: To ride a shrimp or something else
    picture = models.ImageField(upload_to='user_icon', blank=True)
    highest_score = models.IntegerField(default=0)
    user_level = models.IntegerField(default=0)  # (accumulated experience)


# temporary state stored if user quit game
# When user choose 'Resume game', reload
class State(models.Model):
    player = models.OneToOneField(User)
    life_remain = models.IntegerField(default=3)
    current_score = models.IntegerField(default=0)
    current_map = models.TextField(blank=True)
    current_game_level = models.IntegerField(default=0)
    current_location = models.IntegerField(default=0)

# as helper of image loading


class Image(models.Model):
    image = models.ImageField(upload_to='image')


class Room(models.Model):
    user = models.ForeignKey(User)
    # guest = models.ForeignKey(User, related_name='guest')
    label = models.CharField(max_length=256)
    alive = models.IntegerField(default=1)
    game_map = models.TextField(blank=True)

    def __unicode__(self):
        return self.label


class Info(models.Model):
    player = models.OneToOneField(User)
    current_location_x = models.IntegerField(default=0)
    current_location_y = models.IntegerField(default=0)
    win = models.IntegerField(default = 0)
    lose = models.IntegerField(default = 0)

    ready_flag = models.IntegerField(default=0)
    start_flag = models.IntegerField(default=0)
    def __unicode__(self):
        return str(self.current_location_x) + ', ' + str(self.current_location_y) + ', ' + str(self.ready_flag) + ', ' + str(self.start_flag)


class InfoBinding(WebsocketBinding):

    model = Info
    stream = "intval"
    fields = ["__all__"]

    @classmethod
    def group_names(cls, *args, **kwargs):
        return ["intval-updates"]

    def has_permission(self, user, action, pk):
        return True

#State model to record two user mode room
#info, and users in the room
class State_two(models.Model):
    room = models.ForeignKey(Room)
    member = models.ManyToManyField(Info)
