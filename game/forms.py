from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from game.models import *
from django.forms import ModelForm
# + user_state
# + lose
# update_map
# save_map
# + join_room
# + after_died
# + after_died_single

class UserStateForm(forms.Form):
	life = forms.CharField(required=True, max_length=1)
	current_location = forms.CharField(required=True)
	score = forms.CharField(required=True)
	def clean(self):
		cleaned_data = super(UserStateForm, self).clean()
		return cleaned_data
	def clean_life(self):
		life = self.cleaned_data['life']
		if life.isdigit() is False:
			raise forms.ValidationError('Illegal life value')
		if int(life)<0 or int(life)>3:
			raise forms.ValidationError('Illegal life value')
		return life
	def clean_score(self):
		score = self.cleaned_data['score']
		if score.replace('.','1').isdigit() is False:
			raise forms.ValidationError('Illegal score value')
		if float(score)<0:
			raise forms.ValidationError('Illegal score value')
		return score
	def clean_location(self):
		current_location = self.cleaned_data['current_location']
		if current_location.replace('.','1').isdigit() is False:
			raise forms.ValidationError('Illegal location value')
		return current_location

class AfterDiedForm(forms.Form):
	game_score = forms.CharField(required=True)
	def clean(self):
		cleaned_data = super(AfterDiedForm, self).clean()
		return cleaned_data
	def clean_score(self):
		game_score = self.cleaned_data['score']
		if game_score.replace('.','1').isdigit() is False:
			raise forms.ValidationError('Illegal score value')
		if float(game_score)<0:
			raise forms.ValidationError('Illegal score value')
		return game_score
