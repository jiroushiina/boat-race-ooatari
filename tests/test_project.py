import unittest
import ast
import pathlib
import json
class ProjectTests(unittest.TestCase):
 def test_updater_python_syntax(self):
  ast.parse(pathlib.Path('scripts/update_venues.py').read_text())
 def test_official_venue_status(self):
  data=json.loads(pathlib.Path('data/today.json').read_text())
  self.assertIn(data['status'],['verified','unverified'])
  self.assertEqual(len(data['venues']),len(set(data['venues'])))
 def test_frontend_features(self):
  html=pathlib.Path('index.html').read_text()
  for label in ['2連複','2連単','3連複','3連単','DEMO','未確認','localStorage']:
   self.assertIn(label,html)
 def test_workflow_schedule(self):
  workflow=pathlib.Path('.github/workflows/refresh.yml').read_text()
  self.assertIn('scripts/update_venues.py',workflow)
  self.assertIn('schedule:',workflow)
if __name__=='__main__': unittest.main()
