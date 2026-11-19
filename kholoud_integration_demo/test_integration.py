import unittest
from datetime import datetime,timezone,timedelta
from integration import IntegrationDemo,example
class Tests(unittest.TestCase):
    def setUp(self):
        self.app=IntegrationDemo();self.app.onboard('UNI-A-SIS','UNI-A')
    def test_success_and_duplicate_BR030_NFR015(self):
        e=example();self.assertEqual(self.app.send(e)['status'],'Succeeded');self.assertEqual(self.app.send(e)['status'],'DuplicateIgnored');self.assertEqual(len(self.app.students),1)
    def test_scope_BR060(self):
        self.assertEqual(self.app.send(example(institution='UNI-B'))['status'],'SEC-403');self.assertEqual(len(self.app.security_events),1)
    def test_stale_BR056(self):
        now=datetime.now(timezone.utc);self.app.send(example(event_time=now.isoformat()));self.assertEqual(self.app.send(example('MSG-002',(now-timedelta(days=1)).isoformat(),'old'))['status'],'StaleIgnored')
        self.assertEqual(next(iter(self.app.students.values()))['fullName'],'طالب تجريبي')
    def test_update_same_student(self):
        now=datetime.now(timezone.utc);self.app.send(example(event_time=now.isoformat()));self.assertEqual(self.app.send(example('MSG-002',(now+timedelta(seconds=1)).isoformat(),'Updated'))['status'],'Succeeded');self.assertEqual(len(self.app.students),1)
    def test_missing_fields_BR029(self):
        e=example();del e['externalId'];self.assertEqual(self.app.send(e)['status'],'FailedValidation')
    def test_message_identity_reuse(self):
        e=example();self.app.send(e);e['payload']['fullName']='Changed';self.assertEqual(self.app.send(e)['status'],'FailedValidation')
    def test_inactive_source_FR046(self):
        self.app.onboard('OTHER','UNI-A',connection_ok=False);e=example();e['sourceSystem']='OTHER';self.assertEqual(self.app.send(e)['status'],'FailedValidation')
    def test_invalid_timestamp(self):
        self.assertEqual(self.app.send(example(event_time='yesterday'))['status'],'FailedValidation')
if __name__=='__main__':unittest.main(verbosity=2)
