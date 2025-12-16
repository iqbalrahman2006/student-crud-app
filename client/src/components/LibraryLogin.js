import React, { useState } from 'react';
import { Card, Form, Button, Header, Icon, Message } from 'semantic-ui-react';

const LibraryLogin = ({ onLogin }) => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e, { name, value }) => {
        setCredentials({ ...credentials, [name]: value });
        setError('');
    };

    const handleSubmit = () => {
        setLoading(true);
        // Simulate network delay for realism
        setTimeout(() => {
            const { email, password } = credentials;

            // Hardcoded Credentials Validation as per Client Request
            if (email === 'librarian123@gmail.com' && password === 'Qwerty123') {
                onLogin();
            } else {
                setError('Invalid Email or Password. Access Denied.');
                setLoading(false);
            }
        }, 800);
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh' }}>
            <Card style={{ width: '400px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <Card.Content textAlign='center'>
                    <Icon name='lock' size='huge' color='violet' circular />
                    <Header as='h2' color='violet' style={{ marginTop: '10px' }}>
                        LIBRARY ACCESS
                        <Header.Subheader>Authorized Personnel Only</Header.Subheader>
                    </Header>
                </Card.Content>
                <Card.Content>
                    {error && <Message negative size='small'>{error}</Message>}
                    <Form onSubmit={handleSubmit} error={!!error}>
                        <Form.Input
                            fluid
                            icon='user'
                            iconPosition='left'
                            placeholder='Librarian Email'
                            name='email'
                            value={credentials.email}
                            onChange={handleChange}
                            autoFocus
                        />
                        <Form.Input
                            fluid
                            icon='key'
                            iconPosition='left'
                            placeholder='Password'
                            type='password'
                            name='password'
                            value={credentials.password}
                            onChange={handleChange}
                        />
                        <Button
                            fluid
                            color='violet'
                            size='large'
                            loading={loading}
                            type='submit'
                            style={{ marginTop: '20px' }}
                        >
                            <Icon name='unlock' /> Unlock System
                        </Button>
                    </Form>
                </Card.Content>
                <Card.Content extra textAlign='center'>
                    <Icon name='info circle' color='grey' /> Contact Admin for credentials
                </Card.Content>
            </Card>
        </div>
    );
};

export default LibraryLogin;
