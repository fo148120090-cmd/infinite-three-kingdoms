import type { General } from '../types';

const BASE='/infinite-three-kingdoms/images/generals';
export function getGeneralImagePaths(g:Pick<General,'id'>){
  return {
    sd: `${BASE}/${g.id}-sd.svg`,
    portrait: `${BASE}/${g.id}-portrait.svg`,
  };
}
