packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/amazon"
    }
    googlecompute = {
      source  = "github.com/hashicorp/googlecompute"
      version = "~> 1"
    }
  }
}
variable "aws_region" {
  type    = string
  default = "us-east-1"
}
variable "source_ami" {
  type    = string
  default = "ami-04b4f1a9cf54c11d0" // Uses Ubuntu 24.04 LTS x86
}
variable "ami_users" {
  type    = list(string)
  default = []
}

variable "port" {
  type    = number
  default = 8080
}

variable "db_port" {
  type    = number
  default = 5432
}

variable "db_host" {
  type    = string
  default = "localhost"
}

variable "db_name" {
  type    = string
  default = "mydatabase"
}

variable "db_user" {
  type    = string
  default = "myuser"
}

variable "db_password" {
  type    = string
  default = "mypassword"
}
variable "gcp_project_id_dev" {
  type    = string
  default = "csye-6225-452212"
}

variable "gcp_zone" {
  type    = string
  default = "us-central1-a"
}

variable "gcp_instance_type" {
  type    = string
  default = "e2-micro"
}

variable "ssh_username" {
  type    = string
  default = "your-ssh-username"
}

variable "gcp_source_image_family" {
  type    = string
  default = "ubuntu-2004-lts"
}

variable "gcp_disk_type" {
  type    = string
  default = "pd-standard"
}

variable "gcp_service_account_key_file_dev" {
  type    = string
  default = "./placeholder.json"
}

source "googlecompute" "gcp_dev" {
  project_id          = var.gcp_project_id_dev
  zone                = var.gcp_zone
  machine_type        = var.gcp_instance_type
  ssh_username        = var.ssh_username
  source_image_family = var.gcp_source_image_family
  image_name          = "webapp-ami-${formatdate("YYYY-MM-DD-hh-mm-ss", timestamp())}"
  image_description   = "Custom app image for GCP DEV"
  disk_size           = 25
  disk_type           = var.gcp_disk_type
  credentials_file    = var.gcp_service_account_key_file_dev
}

source "amazon-ebs" "ubuntu" {
  region        = var.aws_region
  ami_name      = "webapp-ami-${formatdate("YYYY-MM-DD-hh-mm-ss", timestamp())}"
  ami_users     = var.ami_users
  ami_groups    = []
  instance_type = "t2.small"
  source_ami    = var.source_ami //uses ubuntu 24.04 LTS x86
  ssh_username  = "ubuntu"
}
build {
  sources = [
    "source.amazon-ebs.ubuntu",
  ]

  provisioner "shell" {
    inline = [
      "sudo groupadd -f csye6225",
      "if ! id -u csye6225 > /dev/null 2>&1; then sudo useradd -m -g csye6225 -s /usr/sbin/nologin csye6225; fi"
    ]
  }

  provisioner "shell" {
    inline = [
      "sudo mkdir -p /opt/csye6225",
    ]
  }
  provisioner "shell" {
    inline = [
      "echo 'Creating Linux user \"csye6225\"...'",
      "if ! id -u csye6225 >/dev/null 2>&1; then",
      "  sudo useradd -m -g csye6225 -s /usr/sbin/nologin csye6225 && echo 'User \"csye6225\" created with nologin shell.'",
      "else",
      "  echo 'User \"csye6225\" already exists.'",
      "fi",
      "",
      "echo 'Updating permissions for \"/opt/csye6225\"...'",
      "sudo chown -R csye6225:csye6225 /opt/csye6225",
      "sudo chmod -R 750 /opt/csye6225"
    ]
  }


  provisioner "file" {
    source      = "../artifact/webapp.zip"
    destination = "/tmp/webapp.zip"
  }

  // Move file to /opt/csye6225 with sudo and update permissions
  provisioner "shell" {
    inline = [
      "sudo mv /tmp/webapp.zip /opt/csye6225/webapp.zip",
      "sudo chown csye6225:csye6225 /opt/csye6225/webapp.zip",
    ]
  }


  provisioner "shell" {
    script = "../start.sh"
    environment_vars = [
      "PORT=${var.port}",
      # "DB_PORT=${var.db_port}",
      # "DB_HOST=${var.db_host}",
      # "DB_NAME=${var.db_name}",
      # "DB_USER=${var.db_user}",
      # "DB_PASSWORD=${var.db_password}",
    ]
  }

  provisioner "file" {
    source      = "../artifact/csye6225.service"
    destination = "/tmp/csye6225.service"
  }

  # Run shell commands to set up the instance
  provisioner "shell" {
    inline = [
      "sudo mv /tmp/csye6225.service /etc/systemd/system/csye6225.service",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable csye6225.service"
    ]
  }
}
