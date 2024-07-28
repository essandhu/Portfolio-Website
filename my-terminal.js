// Update colors
$.terminal.xml_formatter.tags.green = (attrs) => {      
    return `[[;#44D544;]`;
};
$.terminal.xml_formatter.tags.blue = (attrs) => {   
    return `[[;#2986cc;;${attrs.class}]`;
};

// Formatter for list of commands
const formatter = new Intl.ListFormat('en', {
    style: 'long',
    type: 'conjunction',
  });

// List of directories
const directories = {
    education: [],
    skills: [],
    projects: [],
};
// Helper function to display directories
function show_dirs() {      
    term.echo(Object.keys(directories).map(dir => {
        return `<blue class="directory">${dir}</blue>`;
    }).join('\n'));
}

// List of commands
const root = '~';
let cwd = root;
const jokeUrl = 'https://v2.jokeapi.dev/joke/Programming?safe-mode';
const commands = {
    help() {            // Display list of commands
        term.echo(`Available commands:\n${help_list}`);
    },
    echo(...args) {     // Display arguments
        if (args.length > 0) {
            term.echo(args.join(' '));
        }
    },
    cd(dir = null) {    // Change directory
        if (dir === null || dir === '..' && cwd !== root) {
            cwd = root;
        } else if (dir.startsWith('~/') && directories.hasOwnProperty(dir.substring(2))) {
            cwd = dir;
        } else if (directories.hasOwnProperty(dir)) {
            cwd = root + '/' + dir;
        } else {
            term.error(`cd: ${dir}: No such file or directory`);
        }
    },
    ls(dir = null) {    // List all directories
        if (dir) {
            if (dir.match(/^~\/?$/)) {  // for commands 'ls ~' or 'ls ~/'
                show_dirs();
            } else if (dir.startsWith('~/')) {
                const path = dir.substring(2);
                const dirs = path.split('/');
                if (dirs.length > 1) {
                    this.error('Invalid directory');
                } else {
                    const dir = dirs[0];
                    this.echo(directories[dir].join('\n'));
                }
            } else if (cwd === root) {
                if (dir in directories) {
                    this.echo(directories[dir].join('\n'));
                } else {
                    this.error('Invalid directory');
                }
            } else if (dir === '..') {
                show_dirs();
            } else {
                this.error('Invalid directory');
            }
        } else if (cwd === root) {
            show_dirs();
        } else {
            const dir = cwd.substring(2);
            this.echo(directories[dir].join('\n'));
        }
    },
    async joke() {  // Display a programming joke with typing animations
        const res = await fetch(jokeUrl);
        const data = await res.json();
        (async () => {
            if (data.type == 'twopart') {
                const prompt = this.get_prompt();       
                this.set_prompt('');                        // Clear prompt to avoid stutter between animations
                await this.echo(`Q: ${data.setup}`, {
                    delay: 50,
                    typing: true
                });
                await this.echo(`A: ${data.delivery}`, {
                    delay: 50,
                    typing: true
                });
                this.set_prompt(prompt);                    // Restore prompt
            } else if (data.type === 'single') {
                await this.echo(data.joke, {
                    delay: 50,
                    typing: true
                });
            }
        })();
    },
    credits() {     // Display references to libraries used
        return [
            '',
            '<white>Libraries used in this project include:</white>',
            '* <a href="https://terminal.jcubic.pl">jQuery Terminal</a>',
            '* <a href="https://github.com/patorjk/figlet.js/">Figlet.js</a>',
            '* <a href="https://github.com/jcubic/isomorphic-lolcat">Isomorphic Lolcat</a>',
            '* <a href="https://jokeapi.dev/">Joke API</a>',
            ''
        ].join('\n');
    }
};
const command_list = ['clear'].concat(Object.keys(commands));   // Add default 'clear' command to list of commands
const formatted_list = command_list.map(cmd => {                // Change command text to white for visibility
    return `<white class="command">${cmd}</white>`;
});
const help_list = formatter.format(formatted_list);               // Send list of commands to formatter

const cmd_regexp = new RegExp(`^\s*(${command_list.join('|')}) (.*)`); // Regular expression to detect commands/args in input
$.terminal.new_formatter(function(string) {
    return string.replace(cmd_regexp, function(_, command, args) {
        return `<white>${command}</white> <aqua>${args}</aqua>`;
    });
});

const user = 'guest';
const server = 'github.io';
function prompt() {                                             // Custom prompt header for terminal         
    return `<green>${user}@${server}</green>:<blue>${cwd}</blue>$ `;
}

// Initialize terminal
const term = $('#projects-terminal').terminal(commands, {
    greetings: false,
    checkArity: false,
    exit: false,
    completion(string) {
        const cmd = this.get_command();
        const { name, rest } = $.terminal.parse_command(cmd);
        if (['cd', 'ls'].includes(name)) {
            if (rest.startsWith('~/')) {
                return Object.keys(directories).map(dir => `~/${dir}`);
            }
            if (cwd === root) {
                return Object.keys(directories);
            }
        }
        return Object.keys(commands);
    },
    prompt
});
// Event handler to execute a command on click
term.on('click', '.command', function() {
    const command = $(this).text();
    term.exec(command, {typing: true, delay: 50});
 });
 // Event handler to change directory on click
 term.on('click', '.directory', function() {
    const dir = $(this).text();
    term.exec(`cd ~/${dir}`);
});

// Pause terminal while loading fonts
term.pause();
 
// Load font from figlet
const font = 'ANSI Shadow';
figlet.defaults({fontPath: 'https://unpkg.com/figlet/fonts/'});
figlet.preloadFonts([font], ready);
 
// Function to render text using figlet
function render(text) {
    const cols = term.cols();
    return figlet.textSync(text, {
        font: font,
        width: cols,
        whitespaceBreak: true
    });
}

// Generate seed for rainbow text
function rand(max) {
    return Math.floor(Math.random() * (max + 1));
}

// Used to change color of greeting message
function rainbow(string, seed) {
    return lolcat.rainbow(function(char, color) {
        char = $.terminal.escape_brackets(char);
        return `[[;${hex(color)};]${char}]`;
    }, string, seed).join('\n');
}

// Map color to hex
function hex(color) {
    return '#' + [color.red, color.green, color.blue].map(n => {
        return n.toString(16).padStart(2, '0');
    }).join('');
}

// Display greetings
function ready() {
    const seed = rand(255);
    term.echo(() => rainbow(render('Project Terminal'), seed, {ansi: true}))
        .echo("<white>Welcome to the Project Terminal!\nThis terminal is intended for viewing programs created by the author of this webpage, as well as providing additional functionality.\nUse 'ls' to display a list of available projects, and 'cd (project name)' for more details.\nType 'help' for a list of other commands.\n</white>").resume();
}


                                                                                        