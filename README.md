# DHCP Relay change on Fortigate Firewalls

I created this script to change all the DHCP Relays on a Fortigate Firewall, because I have several firewalls, which have several interfaces with DHCP Relay configured. Change it manually would take me hours.

# Requirements

- **Operating system:** OSX, Linux, Windows
- **Environment requirements:** [Node 10+](https://nodejs.org/en/)
- **Fortigate Firewall** and **SSH connection permitted** to this one

# Installation

- Clone or download the repository from [Github](https://github.com/Toomaaa/fortigate-dhcp-relay-change)
- Install the packages with `yarn install` or `npm install`

# Usage

- Run `node dhcp-change.js` in command-line
- Follow the prompts
- The script will connect by SSH to the firewall, retrieve list of interfaces that have DHCP relay configured
- Then it will modify the DHCP relay for each of those interfaces

# Customisation

If you want to change the defaults prompts proposal, just modify them at the beginning of the `dhcp-change.js` file
