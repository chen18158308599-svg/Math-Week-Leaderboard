from pathlib import Path
import json
p=Path('output/card_qr/题卡输入提示与接受答案_委员会版.md')
cards=json.loads(Path('src/lib/cards/catalogue.json').read_text(encoding='utf-8'));s=p.read_text(encoding='utf-8');lines=s.splitlines();out=[];index=-1
for line in lines:
 if line.startswith('### '):index+=1
 if line.startswith('- 输入框：'):
  out.append('- 玩家填空提示：'+' / '.join('**'+f+'**' for f in cards[index]['fields']))
 elif not line.startswith('- 玩家英文提示：'):out.append(line)
p.write_text('\n'.join(out)+'\n',encoding='utf-8')
