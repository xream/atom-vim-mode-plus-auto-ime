'use babel'
import { exec, execSync } from 'child_process'
import { CompositeDisposable } from 'atom'

export default {
  insertModeInputSource: null,

  config: {
    getCurrentInputSource: {
      type: 'string',
      description: 'the command to get the current input source',
      default: '/usr/local/bin/issw',
    },
    insert: {
      type: 'string',
      description: 'The command template to change the input source in insert mode. ${source} will be replaced by the last input source we use in insert mode',
      default: '/usr/local/bin/issw ${source}',
    },
    normal: {
      type: 'string',
      description: 'the command to change the input source in normal mode',
      default: '/usr/local/bin/issw com.apple.keylayout.US',
    },
    visual: {
      type: 'string',
      description: 'the command to change the input source in visual mode',
      default: '/usr/local/bin/issw com.apple.keylayout.US',
    },
  },

  activate() {
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.workspace.onDidChangeActiveTextEditor(editor => {
      const view = atom.views.getView(editor)
      if (!view) return
      view.classList.forEach(i => {
        if (!i.endsWith('-mode')) return
        const mode = i.replace('-mode', '')
        this.fn(mode)
      })
    }))
  },

  deactivate() {
    this.subscriptions.dispose()
  },

  fn(mode) {
    if (!['normal', 'insert', 'visual'].includes(mode)) return
    if (mode === 'insert') {
      if (this.insertModeInputSource) {
        execSync(atom.config.get('vim-mode-plus-auto-ime.insert').replace('${source}', this.insertModeInputSource))
      }
    } else {
      const getCurrent = atom.config.get('vim-mode-plus-auto-ime.getCurrentInputSource')
      if(getCurrent && getCurrent.length) {
        exec(getCurrent, (error, stdout, stderr) => {
          const e = error || stderr
          if (e) return console.error(e)
          if (stdout) {
            this.insertModeInputSource = stdout
            const cmd = atom.config.get('vim-mode-plus-auto-ime')[mode]
            if (cmd && cmd.length) execSync(cmd)
          }
        })
      }
    }
  },

  consumeVim({ observeVimStates }) {
    observeVimStates(vimState => {
      if (vimState.onDidActivateMode) {
        vimState.onDidActivateMode(({ mode }) => this.fn(mode))
      } else {
        vimState.modeManager.onDidActivateMode(({ mode }) => this.fn(mode))
      }
    })
  }
}
