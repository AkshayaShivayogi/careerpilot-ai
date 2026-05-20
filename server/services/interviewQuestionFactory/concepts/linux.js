import { buildTechConcepts, builders } from "./topicBuilder.js";

const T = "Linux";

export const linuxConcepts = buildTechConcepts(T, [
  { name: "filesystem permissions", beginner: "chmod chown rwx bits.", intermediate: "umask default permissions.", advanced: "ACLs setfacl fine-grained.", mcq: builders.mcq(T, "linux", "Make script executable?", ["chmod +x", "chown +x", "ln -s"], "chmod +x", "Execute bit.") },
  { name: "process management", beginner: "ps top htop; kill signals SIGTERM.", intermediate: "nice renice priority.", advanced: "cgroups v2 resource control.", coding: builders.coding(T, "Find process using port 8080?", "ss -lntp or lsof -i :8080.", "Modern ss preferred.", "", "—", "—") },
  { name: "systemd services", beginner: "systemctl start enable unit files.", intermediate: "journalctl -u service logs.", advanced: "Restart=on-failure policies.", scenario: builders.scenario(T, "systemd", "Service fails on boot.", "journalctl -xb; After= network dependencies.", "Unit ordering.") },
  { name: "bash scripting", beginner: "set -euo pipefail safer scripts.", intermediate: "trap cleanup EXIT.", advanced: "Shellcheck lint CI.", debug: builders.debug(T, "bash", "Script works manual fails cron.", ["PATH/env differs", "Wrong syntax", "Linux broken"], "PATH/env differs", "Cron minimal env.") },
  { name: "networking tools", beginner: "curl dig ping traceroute.", intermediate: "iptables nftables basics.", advanced: "tcpdump wireshark capture.", why: "SRE debugging." },
  { name: "disk and memory", beginner: "df du free.", intermediate: "inode exhaustion df -i.", advanced: "OOM killer dmesg inspect.", scenario: builders.scenario(T, "disk", "No space left on device.", "Find du -x /; log rotate; docker prune.", "Ephemeral full.") },
  { name: "SSH hardening", beginner: "Key-based auth disable password.", intermediate: "AllowUsers fail2ban.", advanced: "Jump bastion hosts.", bestPractice: { question: "sudo principle?", answer: "Least privilege; log sudoers.", explanation: "Audit trail." } },
  { name: "cron and timers", beginner: "crontab five fields schedule.", intermediate: "systemd timers calendar.", advanced: "Timezone TZ awareness.", coding: builders.coding(T, "Rotate logs automatically?", "logrotate configs copytruncate.", "Disk management.", "", "—", "—") },
  { name: "users groups", beginner: "/etc/passwd /etc/group.", intermediate: "sudo visudo.", advanced: "LDAP/sssd enterprise auth.", why: "Admin interviews." },
  { name: "kernel logs dmesg", beginner: "dmesg hardware driver errors.", intermediate: "sysctl kernel params.", advanced: "ebpf bpftrace tracing.", scenario: builders.scenario(T, "kernel", "Connection tracking table full.", "Increase nf_conntrack_max.", "Heavy NAT.") },
  { name: "package management", beginner: "apt yum dnf install.", intermediate: "Pin versions reproducible.", advanced: "Internal mirrors airgap.", why: "Server provisioning." },
  { name: "performance tuning", beginner: "ulimit open files.", intermediate: "vm.swappiness SSD tuning.", advanced: "perf flamegraphs.", why: "Senior SRE." },
]);
