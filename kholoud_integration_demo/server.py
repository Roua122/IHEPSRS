from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlparse
import json
from pathlib import Path
from integration import IntegrationDemo,example

app=IntegrationDemo()
app.onboard('UNI-A-SIS','UNI-A')
class Handler(BaseHTTPRequestHandler):
    def reply(self,code,data,ctype='application/json; charset=utf-8'):
        raw=(json.dumps(data,ensure_ascii=False,indent=2).encode() if not isinstance(data,bytes) else data)
        self.send_response(code);self.send_header('Content-Type',ctype);self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw)
    def do_GET(self):
        path=urlparse(self.path).path
        if path=='/':return self.reply(200,(Path(__file__).parent/'index.html').read_bytes(),'text/html; charset=utf-8')
        if path=='/api/state':return self.reply(200,app.snapshot())
        if path=='/api/example':return self.reply(200,example())
        self.reply(404,{'error':'Not found'})
    def do_POST(self):
        length=int(self.headers.get('Content-Length','0'))
        if length>65536:return self.reply(413,{'error':'Payload too large'})
        try:body=json.loads(self.rfile.read(length))
        except (ValueError,UnicodeDecodeError):return self.reply(400,{'error':'Invalid JSON'})
        path=urlparse(self.path).path
        if path=='/api/send':return self.reply(200,app.send(body))
        if path=='/api/onboard':
            try:return self.reply(200,app.onboard(body.get('sourceSystem'),body.get('institutionId'),body.get('contractVersion','1.0'),body.get('connectionOk',False)))
            except (ValueError,AttributeError) as e:return self.reply(400,{'error':str(e)})
        self.reply(404,{'error':'Not found'})
if __name__=='__main__':
    print('Open http://localhost:8765 in your browser')
    ThreadingHTTPServer(('127.0.0.1',8765),Handler).serve_forever()
