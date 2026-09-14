import type { Faction, General } from '../types';

type RawGeneral = [string,string,string,Faction,string,number,number,number,number,string,number,string,number,string,number,string,string];

const RAW_GENERALS: RawGeneral[] = [
  ['liu-bei','유비','인덕의 군주','Shu','지원',120,22,2,3,'인덕의 격려',0,'인덕의 대의',0,'쌍검',5,'유비·천룡','용덕의 군주'],
  ['guan-yu','관우','미염공','Shu','전사',150,38,1,3,'청룡참',28,'청룡언월도',55,'청룡언월도',5,'관우·홍련','적토의 무장'],
  ['zhang-fei','장비','만인지적','Shu','수호',190,28,1,2,'호통',0,'장판교 포효',34,'장팔사모',4,'장비·흑염','폭렬의 장군'],
  ['zhao-yun','조운','상산의 용','Shu','기병',135,34,1,4,'용진',18,'칠진칠출',48,'용담창',5,'조운·은룡','은룡의 기사'],
  ['zhuge-liang','제갈량','와룡','Shu','책사',95,30,3,2,'천뢰',24,'공성계',42,'백우선',5,'제갈량·성운','성운의 책사'],
  ['cao-cao','조조','위무제','Wei','책사',125,29,2,3,'간웅의 명령',0,'위무의 천명',36,'의천검',5,'조조·흑금','패왕의 군주'],
  ['xiahou-dun','하후돈','독안의 맹장','Wei','전사',160,35,1,3,'맹격',20,'독안참',45,'칠성도',4,'하후돈·백야','백야의 맹장'],
  ['sun-quan','손권','강동의 호랑이','Wu','지원',130,27,2,3,'강동의 결의',0,'강동패왕',30,'벽옥검',4,'손권·벽옥','벽해의 군주'],
  ['lu-bu','여포','천하무쌍','Warlords','기병',180,48,1,4,'천하무쌍',42,'신마난무',70,'방천화극',5,'여포·적월','적월의 마왕'],
  ['diao-chan','초선','경국지색','Warlords','지원',90,24,2,3,'매혹',0,'폐월의 춤',32,'금선연',4,'초선·월화','월화의 무희'],
];

export const GENERALS: General[] = RAW_GENERALS.map(([id,name,title,faction,role,hp,atk,range,move,skill,skillPower,ultimate,ultimatePower,equipment,grade,tsName,tsTitle]) => ({
  id,name,title,faction,role,hp,atk,range,move,skill,skillPower,ultimate,ultimatePower,equipment,grade,tsName,tsTitle,
}));

export const GENERAL_BY_ID = Object.fromEntries(GENERALS.map(g => [g.id, g])) as Record<string, General>;
