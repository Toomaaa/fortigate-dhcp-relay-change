const inquirer = require('inquirer')
const fs = require('fs')
const Client = require('ssh2').Client
const conn = new Client()

// Defaults value for prompts
const DEFAULTS = {
	_FWLOGIN: 'admin',						// put here the default SSH login for the firewall
	_DHCPRELAY: '172.27.10.10 10.11.12.13' 	// put here the default DHCP servers, separated by a space
}


console.log('\n =======================================')
console.log(' *     Fortigate DHCP Relay change     *')
console.log(' =======================================\n')

inquirer
.prompt([
{
	name: 'ip',
	message: 'IP or DNS name of the firewall ?'
},
{
	name: 'vdom',
	message: 'VDOM on which the changes must be made ? Leave blank if there is no VDOM on the firewall'
},
{
	name: 'login',
	message: 'Firewall Login ?',
	default: DEFAULTS._FWLOGIN
},
{
	type: 'password',
	name: 'pwd',
	message: 'Firewall Password ?'
},
{
	name: 'dhcprelay',
	message: 'DHCP Relays to put (if several, separate them by a space between) ?',
	default: DEFAULTS._DHCPRELAY
},
])
.then(answers => {

	let vdom = ''
	if (answers.vdom !== '') {
		vdom = 'config vdom\nedit ' + answers.vdom + '\n'
	}
	let output = vdom + 'config system interface \n'
	let input = ''

	console.log('\nSSH connection opening to the firewall...')

	conn.on('ready', function() {
		console.log('SSH session opened. Configuration retrieval...')
		conn.exec(vdom + 'config system interface\nshow', function(err, stream) {
			if (err) throw err
				stream.on('close', function(code, signal) {

					fs.mkdir('log', { recursive: true }, (errMkDir) => {
						if (errMkDir) throw errMkDir
							fs.writeFile('log/' + answers.ip + '-old.log', input, function (errWriteOld) {
								if (errWriteOld) throw errWriteOld
									console.log('\n... Actual interfaces configuration saved in ./log/' + answers.ip + '-old.log')

								const regexInterfaces = /edit \"(.*?)\"\n *(.*?)\n *next/gms
								let interfaces = []
								while (regexResult = regexInterfaces.exec(input)) {
									const regexDHCPRelay = /dhcp-relay-ip (.*?)($|\n)/gs

									if ((resultDHCP = regexDHCPRelay.exec(regexResult[2])) !== null) {
										interfaces.push({
											name: regexResult[1],
											dhcpRelay: resultDHCP[1].replace(/\r|\n/g, '')
										})
										output += 'edit "' + regexResult[1] + '"\n'
										output += 'set dhcp-relay-ip "' + answers.dhcprelay.replace(' ', '" "') + '"\n'
										output += 'next\n'
									}
									
								}

								fs.writeFile('log/' + answers.ip + '-new.log', output, (errWriteNew) => {
									console.log('\n... Command to change the DHCP relays are logged in .log/' + answers.ip + '-new.log\n')

									inquirer.prompt([
									{
										name: 'sure',
										message: 'This will change ALL the DHCP relays on the firewall ' + answers.ip + '. Are you sure ?',
										default: 'NO'
									}
									])
									.then(answer => {
										if (answer.sure === 'YES') {
											output += 'end\nexit\n'
											conn.exec(output, function(err2, stream2) {
												if (err2) throw err2
													stream2
												.on('close', function(code2, signal2) {
													console.log('\n\n\n DONE !')
													conn.end()
												})
												.on('data', function(data) {})
												.stderr.on('data', function(data2) {
													console.log('ERROR: ' + data2)
												})
											})
										} else {
											console.log('\n\n The modification has not been applied on the firewall')
											console.log('\n BYE BYE !')
											conn.end()
										}
									})
								})

								
							})
					})
					
				}).on('data', function(data) {
					if (data.indexOf('# ') === -1) {
						input += data
					}
				}).stderr.on('data', function(data) {
					console.log('STDERR: ' + data)
				})
			})
	}).connect({
		host: answers.ip,
		port: 22,
		username: answers.login,
		password: answers.pwd
	})

})
