'use strict';

const DEFAULT_SERVICE_URL = 'http://localhost:5000';

const { Component, h } = preact;

/**
 * Parse a Hypothesis User ID of the form "acct:user@host".
 *
 * This is the format of the `userid` used in annotation and profile responses.
 */
function parseUserid(userid) {
  const re = /^acct:([^@]+)@(.*)$/;
  const [_, username, authority] = userid.match(re);
  return { username, authority };
}

function isPrivate(ann) {
  return !ann.permissions.read.some(p => p.indexOf('group:'));
}

function isInGroup(ann) {
  return !ann.permissions.read.some(p => p.indexOf('group:__world__'));
}

/**
 * A simple JavaScript application which lets the user view some data about
 * their Hypothesis profile.
 */
class App extends Component {
  constructor(props) {
    super(props);

    this.client = new HypothesisAPIClient(DEFAULT_SERVICE_URL);

    const clientId = localStorage.getItem('hypothesis-client-id');

    this.state = {
      // The OAuth client ID.
      clientId,
      // `true` if the user is currently logged in.
      isLoggedIn: false,
      // `true` if we're waiting for user to authorize app.
      authorizing: false,
      // `true` if we're currently fetching profile data.
      fetching: false,
      // The user's profile.
      profile: null,
      // Last `Error` that occurred
      error: null,
      // Statistics about the user's annotations
      annotationStats: null,
    };
  }

  render() {
    let messages = [];
    let loginForm = null;
    let profileInfo = null;

    if (!this.state.isLoggedIn && !this.state.authorizing) {
      loginForm = this._renderLoginForm();
    }

    if (this.state.error) {
      messages.push(`Error: ${this.state.error.message}`);
    }

    if (this.state.authorizing) {
      messages.push('Waiting for authorization…');
    }

    if (this.state.fetching) {
      messages.push('Fetching profile…');
    }

    if (this.state.profile) {
      profileInfo = this._renderProfileInfo();
    }

    return h('div', {},
      messages,
      loginForm,
      profileInfo,
    );
  }

  _clientIdChanged(id) {
    localStorage.setItem('hypothesis-client-id', id);
    this.setState({ clientId: id });
  }

  _renderLoginForm() {
    return h('div', {},
      h('h2', {}, 'Third party client test app'),
      h('form', { onSubmit: (e) => this._login(e) },
        h('input', {
          name: 'client_id',
          placeholder: 'OAuth Client ID',
          onInput: (e) => this._clientIdChanged(e.target.value),
          value: this.state.clientId,
        }),
        h('button', {}, 'Login to Hypothesis')
      )
    );
  }

  _renderProfileInfo() {
    const { userid, groups } = this.state.profile;
    const { username } = parseUserid(userid);

    return h('div', {},
      // Profile info
      h('div', {},
        h('h2', {}, 'Profile'),
        `Username: ${username}`
      ),

      // Groups list
      h('div', {},
        h('h2', {}, 'Groups'),
        h('ul',{},
          groups
            .filter(g => g.url)
            .map(g =>
            h('li', {}, h('a', {
              href: g.url,
              target: '_blank',
            }, g.name))
          )
         )
      ),

      // Annotation stats
      h('div', {},
        h('h2', {}, 'Annotation Stats'),
        this.state.annotationStats ? [
          h('div', {}, `Total: ${this.state.annotationStats.total}`),
          h('div', {}, `Private: ${this.state.annotationStats.privateTotal}`),
          h('div', {}, `In groups: ${this.state.annotationStats.groupTotal}`),
        ] :
          'Fetching…'
      ),

      h('hr'),

      // Logout
      h('button', {
        onClick: () => this._logout()
      }, 'Logout')
    );
  }

  _logout() {
    this.setState({
      annotationStats: null,
      isLoggedIn: false,
      profile: null,
    });

    this.client.logout();
  }

  /**
   * Handle the login form's "submit" event.
   */
  _login(e) {
    e.preventDefault();

    this.setState({
      authorizing: true,
      error: null,
    });

    const clientId = e.target.elements.client_id.value;

    this.client.login(clientId).then((token) => {
      this.setState({
        authorizing: false,
        isLoggedIn: true,
        fetching: true,
      });

      return this.client.request('profile.read');
    }).then((profile) => {
      this.setState({
        fetching: false,
        profile,
      });

      this.client.fetchAll().then((anns) => {
        const total = anns.length;
        const privateTotal = anns.filter(isPrivate).length;
        const groupTotal = anns.filter(isInGroup).length;

        this.setState({
          annotationStats: { total, privateTotal, groupTotal },
        });
      }).catch((err) => {
        this.setState({ error: err });
      });
    }).catch((err) => {
      this.setState({
        authorizing: false,
        fetching: false,
        error: err,
      });
    });
  }
}

preact.render(h(App), document.querySelector('#app'));
