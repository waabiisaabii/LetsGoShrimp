from django.conf.urls import include, url

from django.contrib import admin, auth
import django.contrib.auth.views
import game.views


urlpatterns = [
    url(r'/admin/', admin.site.urls),
    # url(r'sub_life/(?P<id>\d+)$', game.views.sub_life, name='sub_life'),
    url(r'update_state/(?P<id>\d+)$', game.views.update_state, name='update_state'),
    url(r'lose/(?P<id>\d+)$', game.views.lose, name='lose'),
    url(r'update_map/(?P<id>\d+)$', game.views.update_map, name='update_map'),
    url(r'(?P<label>[\w-]{,50})/save_map/(?P<id>\d+)$',
        game.views.save_map, name='save_map'),
    url(r'whether_new/(?P<id>\d+)$', game.views.whether_new, name='whether_new'),
    url(r'(?P<label>[\w-]{,50})/load_map/(?P<id>\d+)$', game.views.load_map, name='load_map'),
    url(r'signup/$', game.views.signup, name='signup'),
    url(r'login/$', auth.views.login,
        {'template_name': 'game/login.html'}, name='login'),
    url(r'logout/$', auth.views.logout_then_login, name='logout'),
    url(r'new_game/$', game.views.new_game, name='new_game'),
    url(r'game/$', game.views.game, name='game'),

    url(r'home/$', game.views.home, name='home'),
    url(r'getRooms$', game.views.getRooms, name='getRooms'),
    url(r'home_get_resume_flag/$', game.views.home_get_resume_flag, name='home_get_resume_flag'),
    
    url(r'photo/(?P<id>\d+)$', game.views.get_photo, name='photo'),
    url(r'died/(?P<id>\d+)/$', game.views.after_died, name='after_died'),
    url(r'died_single/(?P<id>\d+)/$', game.views.after_died_single, name='after_died_single'),
    url(r'create_room/$', game.views.create_room, name='create_room'),
    url(r'join_room/(?P<label>[\w-]{,50})/$', game.views.join_room, name='join_room'),


]
