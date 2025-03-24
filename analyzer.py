#!/usr/bin/env python3
"""
Camera Platform Repository Analyzer
This script clones and analyzes the platform_monitors4 repository to:
1. Determine supported camera types
2. Check licensing requirements
3. Document installation process
"""

import os
import sys
import subprocess
import re
import json
import shutil
from pathlib import Path
import tempfile

class RepositoryAnalyzer:
    def __init__(self, repo_url="https://github.com/silverblade34/platform_monitors4.git"):
        self.repo_url = repo_url
        self.temp_dir = tempfile.mkdtemp()
        self.repo_path = os.path.join(self.temp_dir, "platform_monitors4")
        self.results = {
            "repo_name": "platform_monitors4",
            "camera_support": [],
            "licensing": {"required": False, "details": ""},
            "installation": {"steps": [], "requirements": []},
            "file_structure": [],
            "key_features": []
        }
    
    def clone_repo(self):
        """Clone the GitHub repository to a temporary directory"""
        print(f"Cloning {self.repo_url} to {self.temp_dir}...")
        try:
            result = subprocess.run(
                ["git", "clone", self.repo_url, self.repo_path], 
                capture_output=True, 
                text=True,
                check=True
            )
            print("Repository cloned successfully.")
            return True
        except subprocess.CalledProcessError as e:
            print(f"Error cloning repository: {e.stderr}")
            return False
    
    def analyze_file_structure(self):
        """Analyze the repository file structure"""
        print("Analyzing file structure...")
        
        structure = []
        for root, dirs, files in os.walk(self.repo_path):
            # Skip .git directory
            if '.git' in dirs:
                dirs.remove('.git')
                
            level = root.replace(self.repo_path, '').count(os.sep)
            indent = '  ' * level
            rel_path = os.path.relpath(root, self.repo_path)
            if rel_path == '.':
                rel_path = ''
                
            structure.append(f"{indent}{os.path.basename(root)}/")
            
            sub_indent = '  ' * (level + 1)
            for file in files:
                structure.append(f"{sub_indent}{file}")
        
        self.results["file_structure"] = structure
    
    def search_camera_support(self):
        """Identify supported camera types by analyzing code"""
        print("Searching for camera support information...")
        
        # Common camera protocols and brands to search for
        camera_keywords = [
            "RTSP", "ONVIF", "IP camera", "Hikvision", "Dahua", "Axis", 
            "Bosch", "Sony", "Panasonic", "MJPEG", "H.264", "H.265",
            "MPEG", "JPEG", "RTMP", "HTTP stream", "USB camera", "webcam"
        ]
        
        cameras_found = set()
        
        # Search for camera types in code files
        for root, _, files in os.walk(self.repo_path):
            for file in files:
                if file.endswith(('.py', '.js', '.html', '.md', '.txt', '.json', '.xml')):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            
                            # Look for camera-related keywords
                            for keyword in camera_keywords:
                                if re.search(r'\b' + re.escape(keyword) + r'\b', content, re.IGNORECASE):
                                    cameras_found.add(keyword)
                                    
                            # Look for URL patterns that could indicate camera streams
                            rtsp_urls = re.findall(r'rtsp://[^\s"\']+', content)
                            http_stream_urls = re.findall(r'http[s]?://[^\s"\']+\.(mjpeg|mjpg|cgi|stream)', content)
                            
                            if rtsp_urls:
                                cameras_found.add("RTSP")
                            if http_stream_urls:
                                cameras_found.add("HTTP Stream")
                    except Exception as e:
                        continue
        
        self.results["camera_support"] = list(cameras_found)
        
        # Check for specific integration files
        integration_dirs = [
            "camera", "cameras", "stream", "streaming", "video", "rtsp", "onvif"
        ]
        
        for root, dirs, _ in os.walk(self.repo_path):
            for dirname in dirs:
                if dirname.lower() in integration_dirs:
                    self.results["key_features"].append(f"Found possible camera integration directory: {dirname}")
    
    def check_licensing(self):
        """Check if the repository requires licensing"""
        print("Checking for licensing requirements...")
        
        license_keywords = [
            "license", "licence", "api key", "token", "auth", "registration", 
            "activate", "subscription", "purchase"
        ]
        
        license_files = [
            "LICENSE", "LICENSE.md", "LICENSE.txt", "LICENCE", 
            "COPYING", "COPYRIGHT"
        ]
        
        # Check for license files
        for license_file in license_files:
            license_path = os.path.join(self.repo_path, license_file)
            if os.path.exists(license_path):
                try:
                    with open(license_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        self.results["licensing"]["details"] = f"Found license file: {license_file}"
                        break
                except:
                    pass
        
        # Search for license-related code
        license_evidence = []
        
        for root, _, files in os.walk(self.repo_path):
            for file in files:
                if file.endswith(('.py', '.js', '.html', '.md', '.txt', '.json', '.xml')):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read().lower()
                            
                            # Look for license verification functions
                            if re.search(r'(check|verify|validate)_license', content):
                                license_evidence.append(f"License verification function found in {file}")
                                
                            # Look for license keys
                            for keyword in license_keywords:
                                if re.search(r'\b' + re.escape(keyword) + r'\b', content):
                                    if re.search(r'(key|token|code)\s*=', content) or \
                                       re.search(r'enter.*' + re.escape(keyword), content):
                                        license_evidence.append(f"License-related code found in {file}: {keyword}")
                    except:
                        continue
        
        if license_evidence:
            self.results["licensing"]["required"] = True
            self.results["licensing"]["details"] = "\n".join(license_evidence)
    
    def analyze_installation(self):
        """Analyze the installation process"""
        print("Analyzing installation process...")
        
        # Check for installation files
        install_files = [
            "README.md", "INSTALL.md", "INSTALLATION.md", "SETUP.md",
            "requirements.txt", "package.json", "setup.py", "Dockerfile",
            "docker-compose.yml"
        ]
        
        for install_file in install_files:
            file_path = os.path.join(self.repo_path, install_file)
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                        # Look for installation instructions in README files
                        if install_file.endswith('.md'):
                            # Find installation section headers
                            install_sections = re.findall(r'#+\s*(Installation|Setup|Getting Started|Quick Start|How to run|Deploy|Usage)', content, re.IGNORECASE)
                            
                            if install_sections:
                                self.results["installation"]["steps"].append(f"Found installation instructions in {install_file}")
                        
                        # Extract requirements from requirements.txt
                        if install_file == "requirements.txt":
                            requirements = [line.strip() for line in content.split('\n') if line.strip() and not line.startswith('#')]
                            self.results["installation"]["requirements"].extend(requirements)
                        
                        # Extract dependencies from package.json
                        if install_file == "package.json":
                            try:
                                pkg_data = json.loads(content)
                                if "dependencies" in pkg_data:
                                    for dep, version in pkg_data["dependencies"].items():
                                        self.results["installation"]["requirements"].append(f"{dep}: {version}")
                            except:
                                pass
                except:
                    continue
        
        # Check for common installation patterns
        if os.path.exists(os.path.join(self.repo_path, "requirements.txt")):
            self.results["installation"]["steps"].append("1. Install Python dependencies: pip install -r requirements.txt")
        
        if os.path.exists(os.path.join(self.repo_path, "package.json")):
            self.results["installation"]["steps"].append("1. Install Node.js dependencies: npm install")
        
        # Look for main Python files
        main_files = ["main.py", "app.py", "server.py", "run.py", "index.py"]
        for main_file in main_files:
            if os.path.exists(os.path.join(self.repo_path, main_file)):
                self.results["installation"]["steps"].append(f"2. Run the application: python {main_file}")
                break
    
    def analyze_key_features(self):
        """Identify key features of the platform"""
        print("Analyzing key features...")
        
        # Look for common web frameworks
        frameworks = {
            "django": "Django web framework",
            "flask": "Flask web framework",
            "fastapi": "FastAPI framework",
            "react": "React.js frontend framework",
            "vue": "Vue.js frontend framework",
            "angular": "Angular frontend framework",
            "express": "Express.js backend framework"
        }
        
        # Identify database technologies
        databases = {
            "sqlite": "SQLite database",
            "postgresql": "PostgreSQL database",
            "mysql": "MySQL database",
            "mongodb": "MongoDB database",
            "firebase": "Firebase database"
        }
        
        # Check for frameworks and databases in requirements and package files
        req_path = os.path.join(self.repo_path, "requirements.txt")
        if os.path.exists(req_path):
            try:
                with open(req_path, 'r') as f:
                    content = f.read().lower()
                    for key, description in frameworks.items():
                        if key in content:
                            self.results["key_features"].append(description)
                    
                    for key, description in databases.items():
                        if key in content:
                            self.results["key_features"].append(description)
            except:
                pass
        
        pkg_path = os.path.join(self.repo_path, "package.json")
        if os.path.exists(pkg_path):
            try:
                with open(pkg_path, 'r') as f:
                    data = json.load(f)
                    deps = {}
                    if "dependencies" in data:
                        deps.update(data["dependencies"])
                    if "devDependencies" in data:
                        deps.update(data["devDependencies"])
                    
                    for pkg in deps:
                        for key, description in frameworks.items():
                            if key in pkg.lower():
                                self.results["key_features"].append(description)
                        
                        for key, description in databases.items():
                            if key in pkg.lower():
                                self.results["key_features"].append(description)
            except:
                pass
    
    def generate_report(self):
        """Generate a comprehensive report of findings"""
        print("Generating report...")
        
        # Read the HTML template
        with open("report.html", "r") as f:
            template = f.read()
        
        # Format camera support
        camera_support_html = "<ul>"
        if self.results["camera_support"]:
            for camera in self.results["camera_support"]:
                camera_support_html += f"<li>{camera}</li>"
        else:
            camera_support_html += "<li>No specific camera support information found</li>"
        camera_support_html += "</ul>"
        
        # Format licensing
        if self.results["licensing"]["required"]:
            licensing_html = f"<p><strong>Licensing Required:</strong> Yes</p><p>{self.results['licensing']['details']}</p>"
        else:
            licensing_html = "<p><strong>Licensing Required:</strong> No explicit licensing requirements found</p>"
        
        # Format installation steps
        installation_html = "<ol>"
        if self.results["installation"]["steps"]:
            for step in self.results["installation"]["steps"]:
                installation_html += f"<li>{step}</li>"
        else:
            installation_html += "<li>No specific installation steps found</li>"
        installation_html += "</ol>"
        
        # Format requirements
        requirements_html = "<ul>"
        if self.results["installation"]["requirements"]:
            for req in self.results["installation"]["requirements"]:
                requirements_html += f"<li>{req}</li>"
        else:
            requirements_html += "<li>No specific requirements found</li>"
        requirements_html += "</ul>"
        
        # Format file structure
        file_structure_html = "<pre>"
        for line in self.results["file_structure"]:
            file_structure_html += line + "\n"
        file_structure_html += "</pre>"
        
        # Format key features
        key_features_html = "<ul>"
        if self.results["key_features"]:
            for feature in self.results["key_features"]:
                key_features_html += f"<li>{feature}</li>"
        else:
            key_features_html += "<li>No specific features identified</li>"
        key_features_html += "</ul>"
        
        # Replace placeholders in the template
        report_html = template.replace("{{repo_name}}", self.results["repo_name"])
        report_html = report_html.replace("{{camera_support}}", camera_support_html)
        report_html = report_html.replace("{{licensing}}", licensing_html)
        report_html = report_html.replace("{{installation}}", installation_html)
        report_html = report_html.replace("{{requirements}}", requirements_html)
        report_html = report_html.replace("{{file_structure}}", file_structure_html)
        report_html = report_html.replace("{{key_features}}", key_features_html)
        
        # Save the report
        with open("report.html", "w") as f:
            f.write(report_html)
        
        print(f"Report generated: report.html")
    
    def cleanup(self):
        """Clean up temporary directories"""
        try:
            shutil.rmtree(self.temp_dir)
            print(f"Temporary directory cleaned up: {self.temp_dir}")
        except Exception as e:
            print(f"Error during cleanup: {e}")
    
    def analyze(self):
        """Perform the full analysis"""
        try:
            if not self.clone_repo():
                print("Failed to clone repository. Exiting.")
                return False
            
            self.analyze_file_structure()
            self.search_camera_support()
            self.check_licensing()
            self.analyze_installation()
            self.analyze_key_features()
            self.generate_report()
            
            print("\nAnalysis complete!")
            print(f"Results available in report.html")
            
            return True
        except Exception as e:
            print(f"Error during analysis: {e}")
            return False
        finally:
            self.cleanup()

if __name__ == "__main__":
    analyzer = RepositoryAnalyzer()
    analyzer.analyze()
