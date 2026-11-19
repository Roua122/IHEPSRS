"""Academic integration PoC. Standard library only. Not production authentication."""
import json, time, uuid
from datetime import datetime, timezone, timedelta
from threading import RLock

class IntegrationDemo:
    def __init__(self):
        self.sources = {}; self.students = {}; self.messages = []; self.identities = {}; self.lock = RLock(); self.security_events=[]

    def onboard(self, source, institution, contract='1.0', connection_ok=True):
        if not source or not institution or not contract.startswith('1.'):
            raise ValueError('Invalid source, institution or contract version')
        with self.lock:
            self.sources[source]={'institutionId':institution,'contractVersion':contract,'state':'Active' if connection_ok else 'Pending', 'connectionTest':'Passed' if connection_ok else 'Failed'}
            return dict(self.sources[source])

    def send(self, envelope):
        start=time.perf_counter(); received=datetime.now(timezone.utc)
        source=envelope.get('sourceSystem'); mid=envelope.get('messageId'); ext=envelope.get('externalId'); event=envelope.get('eventTime'); payload=envelope.get('payload')
        correlation=envelope.get('correlationId') or str(uuid.uuid4())
        record={'sourceSystem':source,'messageId':mid,'externalId':ext,'correlationId':correlation,'receivedAt':received.isoformat(),'eventTime':event,'attempt':1}
        def finish(status, reason=''):
            record.update(status=status,reason=reason,durationMs=round((time.perf_counter()-start)*1000,3))
            self.messages.append(record.copy());return record.copy()
        with self.lock:
            config=self.sources.get(source)
            if not config or config['state']!='Active':return finish('FailedValidation','Unknown or inactive integration source')
            if not all(isinstance(v,str) and v.strip() for v in (mid,ext,event)) or not isinstance(payload,dict):
                return finish('FailedValidation','Missing canonical envelope fields')
            try: event_dt=datetime.fromisoformat(event.replace('Z','+00:00'))
            except ValueError:return finish('FailedValidation','Invalid eventTime')
            if event_dt.tzinfo is None:return finish('FailedValidation','eventTime must have timezone')
            if not all(isinstance(payload.get(k),str) and payload[k].strip() for k in ('institutionId','studentNumber','fullName')):
                return finish('FailedValidation','Invalid student payload')
            if payload['institutionId']!=config['institutionId']:
                self.security_events.append({'code':'SEC-403','sourceSystem':source,'correlationId':correlation,'at':received.isoformat()})
                return finish('SEC-403','Institution scope mismatch')
            identity=(source,mid)
            fingerprint=json.dumps({'externalId':ext,'eventTime':event,'payload':payload},sort_keys=True,ensure_ascii=False)
            if identity in self.identities:
                return finish('DuplicateIgnored' if self.identities[identity]==fingerprint else 'FailedValidation', 'Same message already processed' if self.identities[identity]==fingerprint else 'Message identity reused with different content')
            # Only successful/stale messages consume an idempotency identity.
            key=(source,ext)
            previous=self.students.get(key)
            if previous and event_dt<=datetime.fromisoformat(previous['eventTime']):
                self.identities[identity]=fingerprint
                return finish('StaleIgnored','Older or equal source event time')
            self.students[key]={**payload,'externalId':ext,'sourceSystem':source,'eventTime':event_dt.isoformat()}
            self.identities[identity]=fingerprint
            return finish('Succeeded')

    def snapshot(self):
        with self.lock:return {'sources':self.sources,'students':list(self.students.values()),'messages':self.messages,'securityEvents':self.security_events}

def example(message_id='MSG-001',event_time=None,student_name='طالب تجريبي',institution='UNI-A'):
    return {'sourceSystem':'UNI-A-SIS','messageId':message_id,'externalId':'UNI-A-ST-1001','eventTime':event_time or datetime.now(timezone.utc).isoformat(),'contractVersion':'1.0','payload':{'institutionId':institution,'studentNumber':'2026001','fullName':student_name}}
