import {Injectable} from '@angular/core';
import {Action, State, StateContext} from '@ngxs/store';
import {SetSetting} from './settings.actions';

export type PoseViewerSetting = 'pose' | 'avatar' | 'person';

export interface SettingsStateModel {
  receiveVideo: boolean;

  detectSign: boolean;

  animatePose: boolean;

  drawVideo: boolean;
  drawPose: boolean;
  drawSignWriting: boolean;

  appearance: string;

  poseViewer: PoseViewerSetting;

  theme: 'light' | 'dark' | 'system';
}

const initialState: SettingsStateModel = {
  receiveVideo: false,

  detectSign: false,

  animatePose: false,

  drawVideo: true,
  drawPose: true,
  drawSignWriting: false,

  poseViewer: 'pose', // Always use skeleton as default

  appearance: '#ffffff',

  theme: 'light',
};

@Injectable()
@State<SettingsStateModel>({
  name: 'settings',
  defaults: initialState,
})
export class SettingsState {
  @Action(SetSetting)
  setSetting({patchState}: StateContext<SettingsStateModel>, {setting, value}: SetSetting): void {
    patchState({[setting]: value});
  }
}
