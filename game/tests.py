# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.test import TestCase, Client

# Create your tests here.
from game.models import *
from django.urls import reverse
from django.contrib.auth.forms import UserCreationForm


class ViewGameTest(TestCase):
    # https://stackoverflow.com/questions/10608681/how-to-test-render-to-template-functions-in-django-tdd
    def setUp(self):
        self.client = Client()
        self.username = 'yachenltest'
        self.password = 'test12345test12345'
        self.user = User.objects.create_user(username=self.username,
            password=self.password)
        self.tempalte_name = 'game'
        self.url = reverse(self.tempalte_name)

    def test_game_without_login(self):
        response = self.client.get(self.url)
        self.assertRedirects(response, '/game/login/?next=/game/game/')

    def test_game_with_login(self):
        self.client.login(username=self.username, password=self.password)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

# class ViewHomeTest(TestCase):
#     # https://stackoverflow.com/questions/10608681/how-to-test-render-to-template-functions-in-django-tdd
#     def setUp(self):
#         self.client = Client()
#         self.username = 'yachenltest'
#         self.password = 'test12345test12345'
#         self.user = User.objects.create_user(username=self.username,
#             password=self.password)
#         self.tempalte_name = 'home'
#         self.url = reverse(self.tempalte_name)

#     def test_home_without_login(self):
#         response = self.client.get(self.url)
#         self.assertRedirects(response, '/game/login/?next=/game/home/')

#     def test_home_with_login(self):
#         self.client.login(username=self.username, password=self.password)

#         user_state = State.objects.all().get(player=self.user)
#         if user_state is not None:
#             self.assertTrue(user_state.current_score is not None)
        

#         response = self.client.get(self.url)
#         self.assertEqual(response.status_code, 200)

class ViewSignupTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.username = 'yachenltest'
        self.password = 'test12345test12345'
        self.tempalte_name = 'signup'
        self.url = reverse(self.tempalte_name)

    def test_signup_without_login_first_time(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        current_num_user = User.objects.all().count()

        self.assertTemplateUsed('game/signup.html')

    def test_signup_without_login_password_not_match(self):
        current_num_user = User.objects.all().count()
        response = self.client.post(self.url,
         {'username': self.username,
         'password1': self.password,
         'password2': self.password + 'aaaa',})
        self.assertEqual(response.status_code, 200)

        self.assertFormError(response, 'forms', 'password2', 
            'The two password fields didn\'t match.')

        new_num_user = User.objects.all().count()
        self.assertEqual(current_num_user, new_num_user)

    def test_signup_without_login_username_equals_password(self):
        current_num_user = User.objects.all().count()
        response = self.client.post(self.url,
         {'username': self.username,
         'password1': self.username,
         'password2': self.username,})

        self.assertFormError(response, 'forms', 'password2', 
            'The password is too similar to the username.')
        # self.assertTrue(User.objects.filter(username=self.username).exists())
        self.assertFalse(User.objects.filter(username=self.username).exists())
        
        new_num_user = User.objects.all().count()
        self.assertEqual(current_num_user, new_num_user)

    def test_signup_without_login_password_do_match(self):
        current_num_user = User.objects.all().count()
        response = self.client.post(self.url,
         {'username': self.username,
         'password1': self.password,
         'password2': self.password,})

        new_num_user = User.objects.all().count()
        self.assertEqual(current_num_user + 1, new_num_user)
        

        self.assertTrue(User.objects.filter(username=self.username).exists())
        user = User.objects.get(username=self.username)

        self.assertTrue(State.objects.filter(player=user).exists())

        self.assertTrue(Game_user.objects.filter(user=user).exists())

        self.assertEqual(response.status_code, 302)
        url = reverse('home')
        self.assertRedirects(response, url)

class ViewUpdateStateTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.username = 'yachenltest'
        self.password = 'test12345test12345'
        self.user = User.objects.create_user(username=self.username,
            password=self.password)
        self.url = reverse('update_state', args=[self.user.id])

    def test_update_state_without_login(self):
        response = self.client.get(self.url)
        self.assertRedirects(response, '/game/login/?next=' + self.url)

    def test_update_state_with_login(self):
        self.client.login(username=self.username, password=self.password)

        user_state = State.objects.create(player=self.user,
                                              life_remain=3,
                                              current_score=0,
                                              current_map='',
                                              current_game_level=0)
        user_state.save()

        new_life = 1
        new_score = 9999
        new_location = 100

        response = self.client.post(self.url, {
            'life': str(new_life),
            'current_location': str(new_location),
            'score': str(new_score),
            })

        self.assertTrue(State.objects.filter(player=self.user).exists())
        new_state = State.objects.get(player=self.user)
        self.assertEqual(new_state.life_remain, new_life)
        self.assertEqual(new_state.current_score, new_score)
        self.assertEqual(new_state.current_location, new_location)


        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('game'))

class ViewUpdateMapTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.username = 'yachenltest'
        self.password = 'test12345test12345'
        self.user = User.objects.create_user(username=self.username,
            password=self.password)
        self.url = reverse('update_map', args=[self.user.id])

    def test_without_login(self):
        response = self.client.get(self.url)
        self.assertRedirects(response, '/game/login/?next=' + self.url)

    # def test_with_login_wo_json(self):
    #     self.client.login(username=self.username, password=self.password)

    #     response = self.client.post(self.url, {
    #         'nojson!': 'aaaa',
    #         })
        # self.assertEqual(response.status_code, 404)

    def test_with_login_w_json(self):
        self.client.login(username=self.username, password=self.password)

        response = self.client.post(self.url, {
            'gameState_json': 'aaaa',
            })

        self.assertEqual(response.status_code, 200)

        self.assertTrue(State.objects.filter(player=self.user).exists())

class ViewSaveMapTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.username = 'yachenltest'
        self.password = 'test12345test12345'
        self.user = User.objects.create_user(username=self.username,
            password=self.password)
        self.label = 'i_am_label'
        self.url = reverse('save_map', args=[self.label, self.user.id,])

    def test_without_login(self):
        response = self.client.get(self.url)
        self.assertRedirects(response, '/game/login/?next=' + self.url)

    # def test_with_login_wo_json(self):
    #     self.client.login(username=self.username, password=self.password)

    #     response = self.client.post(self.url, {
    #         'nojson!': 'aaaa',
    #         })
        # self.assertEqual(response.status_code, 404)

    def test_with_login_w_json(self):
        self.client.login(username=self.username, password=self.password)

        Room.objects.create(user=self.user, label=self.label)

        json_msg = 'aaaa'
        response = self.client.post(self.url, {
            'gameState_json': json_msg,
            })

        import base64
        encoded_map = base64.b64encode(str(json_msg[:]))
        new_room = Room.objects.get(user=self.user)
        self.assertEqual(new_room.game_map, encoded_map)

        self.assertEqual(response.status_code, 200)


class ViewWhetherNewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.username = 'yachenltest'
        self.password = 'test12345test12345'
        self.user = User.objects.create_user(username=self.username,
            password=self.password)
        self.url = reverse('whether_new', args=[self.user.id,])

    def test_without_login(self):
        response = self.client.get(self.url)
        self.assertRedirects(response, '/game/login/?next=' + self.url)

    # def test_with_login_wo_State(self):
    #     self.client.login(username=self.username, password=self.password)
    #     response = self.client.post(self.url)
    #     self.assertEqual(response.status_code, 404)

class ViewLoadMapTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.username = 'yachenltest'
        self.password = 'test12345test12345'
        self.user = User.objects.create_user(username=self.username,
            password=self.password)
        self.label = 'i_am_label'
        self.url = reverse('load_map', args=[self.label, self.user.id,])

    def test_without_login(self):
        response = self.client.get(self.url)
        self.assertRedirects(response, '/game/login/?next=' + self.url)

    # def test_with_login_wo_Room(self):
    #     self.client.login(username=self.username, password=self.password)
    #     response = self.client.post(self.url)
    #     self.assertEqual(response.status_code, 404)

    def test_with_login_wo_Room(self):
        Room.objects.create(user=self.user, label=self.label)
        self.client.login(username=self.username, password=self.password)
        response = self.client.post(self.url)
        self.assertTrue(Room.objects.filter(user=self.user).exists())

        self.assertEqual(response.status_code, 200)

class ViewCreateRoomTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.username = 'yachenltest'
        self.password = 'test12345test12345'
        self.user = User.objects.create_user(username=self.username,
            password=self.password)
        self.url = reverse('create_room')

    def test_without_login(self):
        response = self.client.get(self.url)
        self.assertRedirects(response, '/game/login/?next=' + self.url)

    def test_with_login(self):
        self.client.login(username=self.username, password=self.password)
        response = self.client.post(self.url)

        self.assertTrue(Room.objects.filter(user=self.user).exists())
        r = Room.objects.get(user=self.user)
        self.assertTrue(State_two.objects.filter(room=r).exists())

        self.assertEqual(response.status_code, 302)

class ViewJoinRoomTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.username = 'yachenltest'
        self.password = 'test12345test12345'
        self.user = User.objects.create_user(username=self.username,
            password=self.password)
        self.label = 'i_am_label'
        self.url = reverse('join_room', args=[self.label])

    def test_without_login(self):
        response = self.client.get(self.url)
        self.assertRedirects(response, '/game/login/?next=' + self.url)

    # def test_with_login_wo_Room(self):
    #     self.client.login(username=self.username, password=self.password)
    #     response = self.client.post(self.url)
    #     self.assertFalse(Room.objects.filter(label=self.label).exists())
    #     self.assertEqual(response.status_code, 404)

    def test_with_login_w_Room_wo_StateTwo(self):
        Room.objects.create(user=self.user, label=self.label)
        self.client.login(username=self.username, password=self.password)
        response = self.client.post(self.url)
        self.assertTrue(Room.objects.filter(label=self.label).exists())
        self.assertTrue(response.status_code, 404)

    def test_with_login_w_Room_w_StateTwo(self):
        r = Room.objects.create(user=self.user, label=self.label)
        s = State_two.objects.create(room=r)
        prev_member_count = s.member.all().count()
        self.client.login(username=self.username, password=self.password)
        response = self.client.post(self.url)
        self.assertTrue(Room.objects.filter(label=self.label).exists())
        self.assertTrue(State_two.objects.filter(room=r).exists())
        self.assertTrue(Info.objects.filter(player=self.user).exists())
        self.assertTrue(response.status_code, 200)
        self.assertEqual(s.member.all().count(), prev_member_count + 1)

class ViewAfterDiedTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.username = 'yachenltest'
        self.password = 'test12345test12345'
        self.user = User.objects.create_user(username=self.username,
            password=self.password)
        self.game_user = Game_user.objects.create(user=self.user)
        self.url = reverse('after_died', args=[self.user.id])

    def test_without_login(self):
        response = self.client.get(self.url)
        self.assertRedirects(response, '/game/login/?next=' + self.url)
        self.assertEqual(response.status_code, 302)

    # def test_with_login_wo_gamescore(self):

    #     self.client.login(username=self.username, password=self.password)
    #     response = self.client.post(self.url,
    #         {'no_gamescore!!': 'blahblablah'})

    #     self.assertEqual(response.status_code, 404)
    def test_with_login_w_gamescore(self):
        self.client.login(username=self.username, password=self.password)
        response = self.client.post(self.url,
            {'game_score': '9999'})

        self.assertFalse(Info.objects.filter(player=self.user).exists())
        self.assertFalse(Room.objects.filter(user=self.user).exists())
        self.assertEqual(response.status_code, 302)

class ViewAfterDiedSingleTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.username = 'yachenltest'
        self.password = 'test12345test12345'
        self.user = User.objects.create_user(username=self.username,
            password=self.password)
        self.game_user = Game_user.objects.create(user=self.user)
        self.url = reverse('after_died_single', args=[self.user.id])

    def test_without_login(self):
        response = self.client.get(self.url)
        self.assertRedirects(response, '/game/login/?next=' + self.url)
        self.assertEqual(response.status_code, 302)

    # def test_with_login_wo_gamescore(self):

    #     self.client.login(username=self.username, password=self.password)
    #     response = self.client.post(self.url,
    #         {'no_gamescore!!': 'blahblablah'})

    #     self.assertEqual(response.status_code, 404)


    def test_with_login_w_gamescore(self):
        self.client.login(username=self.username, password=self.password)
        response = self.client.post(self.url,
            {'game_score': '9999'})

        self.assertFalse(State.objects.filter(player=self.user).exists())
        self.assertEqual(response.status_code, 302)


