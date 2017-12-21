#-*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm
from django.shortcuts import render, redirect

from game.models import *
from game.forms import *

from django.shortcuts import render, redirect, get_object_or_404, HttpResponseRedirect
from mimetypes import guess_type
from django.http import HttpResponse, Http404
from django.core import serializers
import json
import random

import base64

###################################################################
# render game page
###################################################################


@login_required
def game(request):
    return render(request, 'game/game.html')


###################################################################
# helper for updating room in home page
###################################################################


@login_required
def getRooms(request):
    rooms = serializers.serialize("json", Room.objects.all())

    return HttpResponse(rooms, content_type='application/json')

###################################################################
# get clear new state when start new game
###################################################################

def new_game(request):
    user_state = State.objects.all().get(player=request.user)
    user_state.current_score = 0
    user_state.save()
    return render(request, 'game/game.html')

###################################################################
# render home page view
# including highest score, current rooms
# flag: determine whether user is resuming game
###################################################################

@login_required
def home(request):
    rooms = Room.objects.all()
    gameusers = Game_user.objects.all().order_by('-highest_score')
    user_state = get_object_or_404(State.objects, player=request.user)
    score = user_state.current_score
    life = user_state.life_remain

    if Info.objects.filter(player=request.user).count() != 0:
        i = Info.objects.get(player=request.user)
        if State_two.objects.filter(member__id=i.id).exists():
            state_2 = get_object_or_404(State_two, member__id=i.id)
            state_2.member.remove(i)
            state_2.save()
            i.delete()
            print('Info object deleted, room count:{}'.format(
                Room.objects.filter(user=request.user).count()))

    flag = 1
    if score == 0 or life == 0:
        flag = 0

    return render(request, 'game/home.html', {'rooms': rooms, 'gameusers': gameusers, 'flag': flag})
###################################################################
# helper function determin whether user is resuming game
###################################################################

@login_required
def home_get_resume_flag(request):

    if State.objects.filter(player=request.user).count() != 0:
        user_state = get_object_or_404(State.objects, player=request.user)
        score = user_state.current_score
    else:
        user_state = None
        score = 0
    flag = 1
    if score == 0:
        flag = 0
    return HttpResponse(flag, content_type='text/plain')

########################################################

# sign up
# initialization of other models


def signup(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            username = form.cleaned_data.get('username')
            raw_password = form.cleaned_data.get('password1')
            user = authenticate(username=username, password=raw_password)
            user_state = State.objects.create(player=user,
                                              life_remain=3,
                                              current_score=0,
                                              current_map='',
                                              current_game_level=0)
            user_state.save()
            game_user = Game_user.objects.create(user=user)
            game_user.save()
            login(request, user)
            return redirect('home')
    else:
        form = UserCreationForm()
    return render(request, 'game/signup.html', {'forms': form})





########################################################

# update user state each second
# write current life, score, level to database
@login_required
def update_state(request, id):
    if request.method != 'POST':
        raise Http404("Illegal Action: HTTP GET")

    form = UserStateForm(data=request.POST)
    if not form.is_valid():
        raise Http404
    life = int(form.cleaned_data.get('life'))
    location = float(form.cleaned_data.get('current_location'))
    score = int(float(form.cleaned_data.get('score')))
    
    user = get_object_or_404(User, id=id)
    user_state = get_object_or_404(State, player=user)
    
    if life:
        user_state.life_remain = life
        user_state.save()
        if score:
            user_state.current_score = score
            user_state.save()
        if location:
            user_state.current_location = location
            user_state.save()
        return redirect('game')


@login_required
def lose(request, id):
    if request.method != 'POST':
        raise Http404("Illegal Action: HTTP GET")

    form = UserStateForm(data=request.POST)
    if not form.is_valid():
        raise Http404

    life = int(form.cleaned_data.get('life'))
    location = float(form.cleaned_data.get('current_location'))
    score = int(float(form.cleaned_data.get('score')))
    
    user = get_object_or_404(User, id=id)
    user_state = get_object_or_404(State, player=user)

    user_state.life_remain = life
    user_state.current_score = score
    user_state.current_location = location
    user_state.save()
    return redirect('game')

########################################################

# update map whenever new game start
###################################################################


@login_required
def update_map(request, id):
    if request.method != 'POST':
        raise Http404("Illegal Action: HTTP GET")

    json_msg = request.POST['gameState_json']
    user = User.objects.all().get(id=id)
    if State.objects.filter(player=user).count() == 0:
        user_state = State.objects.create(player=user,
                                          life_remain=3,
                                          current_score=0,
                                          current_map='',
                                          current_game_level=0)
    else:
        user_state = State.objects.all().get(player=user)
    encoded_map = base64.b64encode(str(json_msg[:]))
    user_state.current_map = encoded_map[:]
    # user_state.update(current_map=encoded_map)
    user_state.save()
    # return redirect('game')

    response_text = user_state.current_map

    return HttpResponse(response_text, content_type="text/plain")

###################################################################
# save map info incase user exit and then resume game
###################################################################

@login_required
def save_map(request, label, id):

    if request.method != 'POST':
        raise Http404("Illegal Action: HTTP GET")

    json_msg = request.POST['gameState_json']
    user = User.objects.all().get(id=id)
    room = Room.objects.all().get(user=user)
    print(str(json_msg[:]));
    encoded_map = base64.b64encode(str(json_msg[:]))
    room.game_map = encoded_map[:]
    # user_state.update(current_map=encoded_map)
    room.save()

    response_text = room.game_map

    return HttpResponse(response_text, content_type="text/plain")


########################################################
# https://stackoverflow.com/questions/15332086/saving-image-file-through-django-shell


# from django.core.files import File
# from game.models import *
# a = Image.objects.create()
# a.image.save('a.png', File(open('game/static/image/a.png', 'r')))

# b = Image.objects.create()
# b.image.save('pill.png', File(open('game/static/image/pill.png', 'r')))

# c = Image.objects.create()
# c.image.save('wangnima.png', File(open('game/static/image/wangnima.png', 'r')))

# d = Image.objects.create()
# d.image.save('bug.png', File(open('game/static/image/bug.png', 'r')))


# @login_required
def get_photo(request, id):
    I = get_object_or_404(Image, id=id)
    if not I.image:
        raise Http404
    content_type = guess_type(I.image.name)
    return HttpResponse(I.image, content_type=content_type)

##########################################################

# determine whether to start a new game or resume an old one
###################################################################


@login_required
def whether_new(request, id):
    user = get_object_or_404(User, id=id)
    user_state = State.objects.all().get(player=user)
    score = user_state.current_score
    if score == 0:
        status = 0
        loadin = {}
    else:
        status = 1
        current_map = user_state.current_map
        decrypt_map = base64.b64decode(current_map)
        life_remain = user_state.life_remain
        print(life_remain)
        current_score = user_state.current_score
        current_location = user_state.current_location
        current_game_level = user_state.current_game_level
        loadin = {'current_map': decrypt_map,
                  'life_remain': life_remain,
                  'current_score': current_score,
                  'current_location': current_location,
                  'current_game_level': current_game_level}
    j = {'status': status, 'loadin': loadin}
    j_return = json.dumps(j)

    return HttpResponse(j_return, content_type='application/json')

###################################################################
# load map when user resume game
# decode the map from b64 encoding
###################################################################

@login_required
def load_map(request, label, id):
    room = Room.objects.all().get(label=label)
    current_map = room.game_map
    decrypt_map = base64.b64decode(current_map)
    map = {'current_map': decrypt_map, }
    j = {'map': map}
    j_return = json.dumps(j)
    return HttpResponse(j_return, content_type='application/json')


###################################################################
# create a room when user clicked 'create room'
# get the user id, generate label,
@login_required
def create_room(request):
    user = request.user
    # user = get_object_or_404(User, id=id)
    num = random.randint(10000, 99999)
    label = user.username + str(num)
    if Room.objects.filter(user=user).count() != 0:
        room = Room.objects.get(user=user)
        room.delete()

    user_room = Room.objects.create(user=user,
                                    label=label,
                                    alive=1)
    label = user.username + str(num)
    user_room.save()
    state = State_two.objects.create(room=user_room)
    state.save()
    return redirect('join_room', label=label)

###################################################################
# when another user clicked link， the link should vanish in home page
###################################################################


@login_required
def join_room(request, label):
    # when another user clicked link
    # the link should vanish in home page
    user = request.user
    
    room = get_object_or_404(Room, label=label)
    state = get_object_or_404(State_two, room=room)

    if Info.objects.filter(player=user).count() != 0:
        Info.objects.filter(player=user).delete()
    info = Info.objects.create(player=user)
    state.member.add(info)

    if user.username != label[0:len(label) - 5]:
        # this user is not the creator of this room
        # room = Room.objects.get(label = label)
        # info = Info.objects.get(player=user)
        # state.member.add(info)
        room.alive = 0
        room.save()
    print(room.alive)
    return render(request, 'game/game2.html', {'room': room})


###################################################################
# two use mode:when user died: update score, delete Info object,
# delete the room object
###################################################################
@login_required
def after_died(request, id):
    user = get_object_or_404(User, id=id)
    game_user = user.game_user
    
    form = AfterDiedForm(data=request.POST)
    if not form.is_valid():
        raise Http404

    score = int(float(form.cleaned_data.get('game_score')))

    game_user.highest_score = max(game_user.highest_score, int(score))
    game_user.user_level += int(score)
    game_user.save()

    # delete Info object
    if Info.objects.filter(player=request.user).count() != 0:
        # i = Info.objects.get(player=request.user)
        i = Info.objects.filter(player=request.user)
        i.delete()
        print('Info object deleted, room count:{}'.format(
            Room.objects.filter(user=request.user).count()))

    if Room.objects.filter(user=request.user).count() > 0:
        print('deleting Room object')
        # r = Room.objects.get(user=request.user)
        r = Room.objects.filter(user=request.user)
        r.delete()
        print('Room object deleted')
    return HttpResponse('Cleaned', content_type="text/plain")



###################################################################
# one use mode when user died: update score, clear current score
###################################################################
@login_required
def after_died_single(request, id):
    user = get_object_or_404(User, id=id)
    game_user = user.game_user
    
    # score = request.POST['game_score']
    form = AfterDiedForm(data=request.POST)
    if not form.is_valid():
        raise Http404

    score = int(float(form.cleaned_data.get('game_score')))

    # if score:
    game_user.highest_score = max(game_user.highest_score, int(score))
    game_user.user_level += int(score)
    game_user.save()

    # delete game state for single player mode
    if State.objects.filter(player=user).count() != 0:
        s = State.objects.get(player=user)
        s.current_score = 0
        s.save()
        print('game state cleared')
    return HttpResponse('Cleaned', content_type="text/plain")
