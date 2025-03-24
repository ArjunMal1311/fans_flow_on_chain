// Code generated by ent, DO NOT EDIT.

package ent

import (
	"context"
	"errors"
	"fmt"
	"log"
	"reflect"

	"arjunmal1311/fans_flow_on_chain/backend/ent/migrate"

	"arjunmal1311/fans_flow_on_chain/backend/ent/model"
	"arjunmal1311/fans_flow_on_chain/backend/ent/subscription"
	"arjunmal1311/fans_flow_on_chain/backend/ent/subscriptionmetis"
	"arjunmal1311/fans_flow_on_chain/backend/ent/subscriptionmoonbeam"
	"arjunmal1311/fans_flow_on_chain/backend/ent/subscriptionzkevm"
	"arjunmal1311/fans_flow_on_chain/backend/ent/user"

	"entgo.io/ent"
	"entgo.io/ent/dialect"
	"entgo.io/ent/dialect/sql"
)

// Client is the client that holds all ent builders.
type Client struct {
	config
	// Schema is the client for creating, migrating and dropping schema.
	Schema *migrate.Schema
	// Model is the client for interacting with the Model builders.
	Model *ModelClient
	// Subscription is the client for interacting with the Subscription builders.
	Subscription *SubscriptionClient
	// SubscriptionMetis is the client for interacting with the SubscriptionMetis builders.
	SubscriptionMetis *SubscriptionMetisClient
	// SubscriptionMoonbeam is the client for interacting with the SubscriptionMoonbeam builders.
	SubscriptionMoonbeam *SubscriptionMoonbeamClient
	// SubscriptionZkEVM is the client for interacting with the SubscriptionZkEVM builders.
	SubscriptionZkEVM *SubscriptionZkEVMClient
	// User is the client for interacting with the User builders.
	User *UserClient
}

// NewClient creates a new client configured with the given options.
func NewClient(opts ...Option) *Client {
	client := &Client{config: newConfig(opts...)}
	client.init()
	return client
}

func (c *Client) init() {
	c.Schema = migrate.NewSchema(c.driver)
	c.Model = NewModelClient(c.config)
	c.Subscription = NewSubscriptionClient(c.config)
	c.SubscriptionMetis = NewSubscriptionMetisClient(c.config)
	c.SubscriptionMoonbeam = NewSubscriptionMoonbeamClient(c.config)
	c.SubscriptionZkEVM = NewSubscriptionZkEVMClient(c.config)
	c.User = NewUserClient(c.config)
}

type (
	// config is the configuration for the client and its builder.
	config struct {
		// driver used for executing database requests.
		driver dialect.Driver
		// debug enable a debug logging.
		debug bool
		// log used for logging on debug mode.
		log func(...any)
		// hooks to execute on mutations.
		hooks *hooks
		// interceptors to execute on queries.
		inters *inters
	}
	// Option function to configure the client.
	Option func(*config)
)

// newConfig creates a new config for the client.
func newConfig(opts ...Option) config {
	cfg := config{log: log.Println, hooks: &hooks{}, inters: &inters{}}
	cfg.options(opts...)
	return cfg
}

// options applies the options on the config object.
func (c *config) options(opts ...Option) {
	for _, opt := range opts {
		opt(c)
	}
	if c.debug {
		c.driver = dialect.Debug(c.driver, c.log)
	}
}

// Debug enables debug logging on the ent.Driver.
func Debug() Option {
	return func(c *config) {
		c.debug = true
	}
}

// Log sets the logging function for debug mode.
func Log(fn func(...any)) Option {
	return func(c *config) {
		c.log = fn
	}
}

// Driver configures the client driver.
func Driver(driver dialect.Driver) Option {
	return func(c *config) {
		c.driver = driver
	}
}

// Open opens a database/sql.DB specified by the driver name and
// the data source name, and returns a new client attached to it.
// Optional parameters can be added for configuring the client.
func Open(driverName, dataSourceName string, options ...Option) (*Client, error) {
	switch driverName {
	case dialect.MySQL, dialect.Postgres, dialect.SQLite:
		drv, err := sql.Open(driverName, dataSourceName)
		if err != nil {
			return nil, err
		}
		return NewClient(append(options, Driver(drv))...), nil
	default:
		return nil, fmt.Errorf("unsupported driver: %q", driverName)
	}
}

// ErrTxStarted is returned when trying to start a new transaction from a transactional client.
var ErrTxStarted = errors.New("ent: cannot start a transaction within a transaction")

// Tx returns a new transactional client. The provided context
// is used until the transaction is committed or rolled back.
func (c *Client) Tx(ctx context.Context) (*Tx, error) {
	if _, ok := c.driver.(*txDriver); ok {
		return nil, ErrTxStarted
	}
	tx, err := newTx(ctx, c.driver)
	if err != nil {
		return nil, fmt.Errorf("ent: starting a transaction: %w", err)
	}
	cfg := c.config
	cfg.driver = tx
	return &Tx{
		ctx:                  ctx,
		config:               cfg,
		Model:                NewModelClient(cfg),
		Subscription:         NewSubscriptionClient(cfg),
		SubscriptionMetis:    NewSubscriptionMetisClient(cfg),
		SubscriptionMoonbeam: NewSubscriptionMoonbeamClient(cfg),
		SubscriptionZkEVM:    NewSubscriptionZkEVMClient(cfg),
		User:                 NewUserClient(cfg),
	}, nil
}

// BeginTx returns a transactional client with specified options.
func (c *Client) BeginTx(ctx context.Context, opts *sql.TxOptions) (*Tx, error) {
	if _, ok := c.driver.(*txDriver); ok {
		return nil, errors.New("ent: cannot start a transaction within a transaction")
	}
	tx, err := c.driver.(interface {
		BeginTx(context.Context, *sql.TxOptions) (dialect.Tx, error)
	}).BeginTx(ctx, opts)
	if err != nil {
		return nil, fmt.Errorf("ent: starting a transaction: %w", err)
	}
	cfg := c.config
	cfg.driver = &txDriver{tx: tx, drv: c.driver}
	return &Tx{
		ctx:                  ctx,
		config:               cfg,
		Model:                NewModelClient(cfg),
		Subscription:         NewSubscriptionClient(cfg),
		SubscriptionMetis:    NewSubscriptionMetisClient(cfg),
		SubscriptionMoonbeam: NewSubscriptionMoonbeamClient(cfg),
		SubscriptionZkEVM:    NewSubscriptionZkEVMClient(cfg),
		User:                 NewUserClient(cfg),
	}, nil
}

// Debug returns a new debug-client. It's used to get verbose logging on specific operations.
//
//	client.Debug().
//		Model.
//		Query().
//		Count(ctx)
func (c *Client) Debug() *Client {
	if c.debug {
		return c
	}
	cfg := c.config
	cfg.driver = dialect.Debug(c.driver, c.log)
	client := &Client{config: cfg}
	client.init()
	return client
}

// Close closes the database connection and prevents new queries from starting.
func (c *Client) Close() error {
	return c.driver.Close()
}

// Use adds the mutation hooks to all the entity clients.
// In order to add hooks to a specific client, call: `client.Node.Use(...)`.
func (c *Client) Use(hooks ...Hook) {
	for _, n := range []interface{ Use(...Hook) }{
		c.Model, c.Subscription, c.SubscriptionMetis, c.SubscriptionMoonbeam,
		c.SubscriptionZkEVM, c.User,
	} {
		n.Use(hooks...)
	}
}

// Intercept adds the query interceptors to all the entity clients.
// In order to add interceptors to a specific client, call: `client.Node.Intercept(...)`.
func (c *Client) Intercept(interceptors ...Interceptor) {
	for _, n := range []interface{ Intercept(...Interceptor) }{
		c.Model, c.Subscription, c.SubscriptionMetis, c.SubscriptionMoonbeam,
		c.SubscriptionZkEVM, c.User,
	} {
		n.Intercept(interceptors...)
	}
}

// Mutate implements the ent.Mutator interface.
func (c *Client) Mutate(ctx context.Context, m Mutation) (Value, error) {
	switch m := m.(type) {
	case *ModelMutation:
		return c.Model.mutate(ctx, m)
	case *SubscriptionMutation:
		return c.Subscription.mutate(ctx, m)
	case *SubscriptionMetisMutation:
		return c.SubscriptionMetis.mutate(ctx, m)
	case *SubscriptionMoonbeamMutation:
		return c.SubscriptionMoonbeam.mutate(ctx, m)
	case *SubscriptionZkEVMMutation:
		return c.SubscriptionZkEVM.mutate(ctx, m)
	case *UserMutation:
		return c.User.mutate(ctx, m)
	default:
		return nil, fmt.Errorf("ent: unknown mutation type %T", m)
	}
}

// ModelClient is a client for the Model schema.
type ModelClient struct {
	config
}

// NewModelClient returns a client for the Model from the given config.
func NewModelClient(c config) *ModelClient {
	return &ModelClient{config: c}
}

// Use adds a list of mutation hooks to the hooks stack.
// A call to `Use(f, g, h)` equals to `model.Hooks(f(g(h())))`.
func (c *ModelClient) Use(hooks ...Hook) {
	c.hooks.Model = append(c.hooks.Model, hooks...)
}

// Intercept adds a list of query interceptors to the interceptors stack.
// A call to `Intercept(f, g, h)` equals to `model.Intercept(f(g(h())))`.
func (c *ModelClient) Intercept(interceptors ...Interceptor) {
	c.inters.Model = append(c.inters.Model, interceptors...)
}

// Create returns a builder for creating a Model entity.
func (c *ModelClient) Create() *ModelCreate {
	mutation := newModelMutation(c.config, OpCreate)
	return &ModelCreate{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// CreateBulk returns a builder for creating a bulk of Model entities.
func (c *ModelClient) CreateBulk(builders ...*ModelCreate) *ModelCreateBulk {
	return &ModelCreateBulk{config: c.config, builders: builders}
}

// MapCreateBulk creates a bulk creation builder from the given slice. For each item in the slice, the function creates
// a builder and applies setFunc on it.
func (c *ModelClient) MapCreateBulk(slice any, setFunc func(*ModelCreate, int)) *ModelCreateBulk {
	rv := reflect.ValueOf(slice)
	if rv.Kind() != reflect.Slice {
		return &ModelCreateBulk{err: fmt.Errorf("calling to ModelClient.MapCreateBulk with wrong type %T, need slice", slice)}
	}
	builders := make([]*ModelCreate, rv.Len())
	for i := 0; i < rv.Len(); i++ {
		builders[i] = c.Create()
		setFunc(builders[i], i)
	}
	return &ModelCreateBulk{config: c.config, builders: builders}
}

// Update returns an update builder for Model.
func (c *ModelClient) Update() *ModelUpdate {
	mutation := newModelMutation(c.config, OpUpdate)
	return &ModelUpdate{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// UpdateOne returns an update builder for the given entity.
func (c *ModelClient) UpdateOne(m *Model) *ModelUpdateOne {
	mutation := newModelMutation(c.config, OpUpdateOne, withModel(m))
	return &ModelUpdateOne{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// UpdateOneID returns an update builder for the given id.
func (c *ModelClient) UpdateOneID(id int) *ModelUpdateOne {
	mutation := newModelMutation(c.config, OpUpdateOne, withModelID(id))
	return &ModelUpdateOne{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// Delete returns a delete builder for Model.
func (c *ModelClient) Delete() *ModelDelete {
	mutation := newModelMutation(c.config, OpDelete)
	return &ModelDelete{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// DeleteOne returns a builder for deleting the given entity.
func (c *ModelClient) DeleteOne(m *Model) *ModelDeleteOne {
	return c.DeleteOneID(m.ID)
}

// DeleteOneID returns a builder for deleting the given entity by its id.
func (c *ModelClient) DeleteOneID(id int) *ModelDeleteOne {
	builder := c.Delete().Where(model.ID(id))
	builder.mutation.id = &id
	builder.mutation.op = OpDeleteOne
	return &ModelDeleteOne{builder}
}

// Query returns a query builder for Model.
func (c *ModelClient) Query() *ModelQuery {
	return &ModelQuery{
		config: c.config,
		ctx:    &QueryContext{Type: TypeModel},
		inters: c.Interceptors(),
	}
}

// Get returns a Model entity by its id.
func (c *ModelClient) Get(ctx context.Context, id int) (*Model, error) {
	return c.Query().Where(model.ID(id)).Only(ctx)
}

// GetX is like Get, but panics if an error occurs.
func (c *ModelClient) GetX(ctx context.Context, id int) *Model {
	obj, err := c.Get(ctx, id)
	if err != nil {
		panic(err)
	}
	return obj
}

// Hooks returns the client hooks.
func (c *ModelClient) Hooks() []Hook {
	return c.hooks.Model
}

// Interceptors returns the client interceptors.
func (c *ModelClient) Interceptors() []Interceptor {
	return c.inters.Model
}

func (c *ModelClient) mutate(ctx context.Context, m *ModelMutation) (Value, error) {
	switch m.Op() {
	case OpCreate:
		return (&ModelCreate{config: c.config, hooks: c.Hooks(), mutation: m}).Save(ctx)
	case OpUpdate:
		return (&ModelUpdate{config: c.config, hooks: c.Hooks(), mutation: m}).Save(ctx)
	case OpUpdateOne:
		return (&ModelUpdateOne{config: c.config, hooks: c.Hooks(), mutation: m}).Save(ctx)
	case OpDelete, OpDeleteOne:
		return (&ModelDelete{config: c.config, hooks: c.Hooks(), mutation: m}).Exec(ctx)
	default:
		return nil, fmt.Errorf("ent: unknown Model mutation op: %q", m.Op())
	}
}

// SubscriptionClient is a client for the Subscription schema.
type SubscriptionClient struct {
	config
}

// NewSubscriptionClient returns a client for the Subscription from the given config.
func NewSubscriptionClient(c config) *SubscriptionClient {
	return &SubscriptionClient{config: c}
}

// Use adds a list of mutation hooks to the hooks stack.
// A call to `Use(f, g, h)` equals to `subscription.Hooks(f(g(h())))`.
func (c *SubscriptionClient) Use(hooks ...Hook) {
	c.hooks.Subscription = append(c.hooks.Subscription, hooks...)
}

// Intercept adds a list of query interceptors to the interceptors stack.
// A call to `Intercept(f, g, h)` equals to `subscription.Intercept(f(g(h())))`.
func (c *SubscriptionClient) Intercept(interceptors ...Interceptor) {
	c.inters.Subscription = append(c.inters.Subscription, interceptors...)
}

// Create returns a builder for creating a Subscription entity.
func (c *SubscriptionClient) Create() *SubscriptionCreate {
	mutation := newSubscriptionMutation(c.config, OpCreate)
	return &SubscriptionCreate{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// CreateBulk returns a builder for creating a bulk of Subscription entities.
func (c *SubscriptionClient) CreateBulk(builders ...*SubscriptionCreate) *SubscriptionCreateBulk {
	return &SubscriptionCreateBulk{config: c.config, builders: builders}
}

// MapCreateBulk creates a bulk creation builder from the given slice. For each item in the slice, the function creates
// a builder and applies setFunc on it.
func (c *SubscriptionClient) MapCreateBulk(slice any, setFunc func(*SubscriptionCreate, int)) *SubscriptionCreateBulk {
	rv := reflect.ValueOf(slice)
	if rv.Kind() != reflect.Slice {
		return &SubscriptionCreateBulk{err: fmt.Errorf("calling to SubscriptionClient.MapCreateBulk with wrong type %T, need slice", slice)}
	}
	builders := make([]*SubscriptionCreate, rv.Len())
	for i := 0; i < rv.Len(); i++ {
		builders[i] = c.Create()
		setFunc(builders[i], i)
	}
	return &SubscriptionCreateBulk{config: c.config, builders: builders}
}

// Update returns an update builder for Subscription.
func (c *SubscriptionClient) Update() *SubscriptionUpdate {
	mutation := newSubscriptionMutation(c.config, OpUpdate)
	return &SubscriptionUpdate{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// UpdateOne returns an update builder for the given entity.
func (c *SubscriptionClient) UpdateOne(s *Subscription) *SubscriptionUpdateOne {
	mutation := newSubscriptionMutation(c.config, OpUpdateOne, withSubscription(s))
	return &SubscriptionUpdateOne{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// UpdateOneID returns an update builder for the given id.
func (c *SubscriptionClient) UpdateOneID(id int) *SubscriptionUpdateOne {
	mutation := newSubscriptionMutation(c.config, OpUpdateOne, withSubscriptionID(id))
	return &SubscriptionUpdateOne{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// Delete returns a delete builder for Subscription.
func (c *SubscriptionClient) Delete() *SubscriptionDelete {
	mutation := newSubscriptionMutation(c.config, OpDelete)
	return &SubscriptionDelete{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// DeleteOne returns a builder for deleting the given entity.
func (c *SubscriptionClient) DeleteOne(s *Subscription) *SubscriptionDeleteOne {
	return c.DeleteOneID(s.ID)
}

// DeleteOneID returns a builder for deleting the given entity by its id.
func (c *SubscriptionClient) DeleteOneID(id int) *SubscriptionDeleteOne {
	builder := c.Delete().Where(subscription.ID(id))
	builder.mutation.id = &id
	builder.mutation.op = OpDeleteOne
	return &SubscriptionDeleteOne{builder}
}

// Query returns a query builder for Subscription.
func (c *SubscriptionClient) Query() *SubscriptionQuery {
	return &SubscriptionQuery{
		config: c.config,
		ctx:    &QueryContext{Type: TypeSubscription},
		inters: c.Interceptors(),
	}
}

// Get returns a Subscription entity by its id.
func (c *SubscriptionClient) Get(ctx context.Context, id int) (*Subscription, error) {
	return c.Query().Where(subscription.ID(id)).Only(ctx)
}

// GetX is like Get, but panics if an error occurs.
func (c *SubscriptionClient) GetX(ctx context.Context, id int) *Subscription {
	obj, err := c.Get(ctx, id)
	if err != nil {
		panic(err)
	}
	return obj
}

// Hooks returns the client hooks.
func (c *SubscriptionClient) Hooks() []Hook {
	return c.hooks.Subscription
}

// Interceptors returns the client interceptors.
func (c *SubscriptionClient) Interceptors() []Interceptor {
	return c.inters.Subscription
}

func (c *SubscriptionClient) mutate(ctx context.Context, m *SubscriptionMutation) (Value, error) {
	switch m.Op() {
	case OpCreate:
		return (&SubscriptionCreate{config: c.config, hooks: c.Hooks(), mutation: m}).Save(ctx)
	case OpUpdate:
		return (&SubscriptionUpdate{config: c.config, hooks: c.Hooks(), mutation: m}).Save(ctx)
	case OpUpdateOne:
		return (&SubscriptionUpdateOne{config: c.config, hooks: c.Hooks(), mutation: m}).Save(ctx)
	case OpDelete, OpDeleteOne:
		return (&SubscriptionDelete{config: c.config, hooks: c.Hooks(), mutation: m}).Exec(ctx)
	default:
		return nil, fmt.Errorf("ent: unknown Subscription mutation op: %q", m.Op())
	}
}

// SubscriptionMetisClient is a client for the SubscriptionMetis schema.
type SubscriptionMetisClient struct {
	config
}

// NewSubscriptionMetisClient returns a client for the SubscriptionMetis from the given config.
func NewSubscriptionMetisClient(c config) *SubscriptionMetisClient {
	return &SubscriptionMetisClient{config: c}
}

// Use adds a list of mutation hooks to the hooks stack.
// A call to `Use(f, g, h)` equals to `subscriptionmetis.Hooks(f(g(h())))`.
func (c *SubscriptionMetisClient) Use(hooks ...Hook) {
	c.hooks.SubscriptionMetis = append(c.hooks.SubscriptionMetis, hooks...)
}

// Intercept adds a list of query interceptors to the interceptors stack.
// A call to `Intercept(f, g, h)` equals to `subscriptionmetis.Intercept(f(g(h())))`.
func (c *SubscriptionMetisClient) Intercept(interceptors ...Interceptor) {
	c.inters.SubscriptionMetis = append(c.inters.SubscriptionMetis, interceptors...)
}

// Create returns a builder for creating a SubscriptionMetis entity.
func (c *SubscriptionMetisClient) Create() *SubscriptionMetisCreate {
	mutation := newSubscriptionMetisMutation(c.config, OpCreate)
	return &SubscriptionMetisCreate{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// CreateBulk returns a builder for creating a bulk of SubscriptionMetis entities.
func (c *SubscriptionMetisClient) CreateBulk(builders ...*SubscriptionMetisCreate) *SubscriptionMetisCreateBulk {
	return &SubscriptionMetisCreateBulk{config: c.config, builders: builders}
}

// MapCreateBulk creates a bulk creation builder from the given slice. For each item in the slice, the function creates
// a builder and applies setFunc on it.
func (c *SubscriptionMetisClient) MapCreateBulk(slice any, setFunc func(*SubscriptionMetisCreate, int)) *SubscriptionMetisCreateBulk {
	rv := reflect.ValueOf(slice)
	if rv.Kind() != reflect.Slice {
		return &SubscriptionMetisCreateBulk{err: fmt.Errorf("calling to SubscriptionMetisClient.MapCreateBulk with wrong type %T, need slice", slice)}
	}
	builders := make([]*SubscriptionMetisCreate, rv.Len())
	for i := 0; i < rv.Len(); i++ {
		builders[i] = c.Create()
		setFunc(builders[i], i)
	}
	return &SubscriptionMetisCreateBulk{config: c.config, builders: builders}
}

// Update returns an update builder for SubscriptionMetis.
func (c *SubscriptionMetisClient) Update() *SubscriptionMetisUpdate {
	mutation := newSubscriptionMetisMutation(c.config, OpUpdate)
	return &SubscriptionMetisUpdate{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// UpdateOne returns an update builder for the given entity.
func (c *SubscriptionMetisClient) UpdateOne(sm *SubscriptionMetis) *SubscriptionMetisUpdateOne {
	mutation := newSubscriptionMetisMutation(c.config, OpUpdateOne, withSubscriptionMetis(sm))
	return &SubscriptionMetisUpdateOne{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// UpdateOneID returns an update builder for the given id.
func (c *SubscriptionMetisClient) UpdateOneID(id int) *SubscriptionMetisUpdateOne {
	mutation := newSubscriptionMetisMutation(c.config, OpUpdateOne, withSubscriptionMetisID(id))
	return &SubscriptionMetisUpdateOne{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// Delete returns a delete builder for SubscriptionMetis.
func (c *SubscriptionMetisClient) Delete() *SubscriptionMetisDelete {
	mutation := newSubscriptionMetisMutation(c.config, OpDelete)
	return &SubscriptionMetisDelete{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// DeleteOne returns a builder for deleting the given entity.
func (c *SubscriptionMetisClient) DeleteOne(sm *SubscriptionMetis) *SubscriptionMetisDeleteOne {
	return c.DeleteOneID(sm.ID)
}

// DeleteOneID returns a builder for deleting the given entity by its id.
func (c *SubscriptionMetisClient) DeleteOneID(id int) *SubscriptionMetisDeleteOne {
	builder := c.Delete().Where(subscriptionmetis.ID(id))
	builder.mutation.id = &id
	builder.mutation.op = OpDeleteOne
	return &SubscriptionMetisDeleteOne{builder}
}

// Query returns a query builder for SubscriptionMetis.
func (c *SubscriptionMetisClient) Query() *SubscriptionMetisQuery {
	return &SubscriptionMetisQuery{
		config: c.config,
		ctx:    &QueryContext{Type: TypeSubscriptionMetis},
		inters: c.Interceptors(),
	}
}

// Get returns a SubscriptionMetis entity by its id.
func (c *SubscriptionMetisClient) Get(ctx context.Context, id int) (*SubscriptionMetis, error) {
	return c.Query().Where(subscriptionmetis.ID(id)).Only(ctx)
}

// GetX is like Get, but panics if an error occurs.
func (c *SubscriptionMetisClient) GetX(ctx context.Context, id int) *SubscriptionMetis {
	obj, err := c.Get(ctx, id)
	if err != nil {
		panic(err)
	}
	return obj
}

// Hooks returns the client hooks.
func (c *SubscriptionMetisClient) Hooks() []Hook {
	return c.hooks.SubscriptionMetis
}

// Interceptors returns the client interceptors.
func (c *SubscriptionMetisClient) Interceptors() []Interceptor {
	return c.inters.SubscriptionMetis
}

func (c *SubscriptionMetisClient) mutate(ctx context.Context, m *SubscriptionMetisMutation) (Value, error) {
	switch m.Op() {
	case OpCreate:
		return (&SubscriptionMetisCreate{config: c.config, hooks: c.Hooks(), mutation: m}).Save(ctx)
	case OpUpdate:
		return (&SubscriptionMetisUpdate{config: c.config, hooks: c.Hooks(), mutation: m}).Save(ctx)
	case OpUpdateOne:
		return (&SubscriptionMetisUpdateOne{config: c.config, hooks: c.Hooks(), mutation: m}).Save(ctx)
	case OpDelete, OpDeleteOne:
		return (&SubscriptionMetisDelete{config: c.config, hooks: c.Hooks(), mutation: m}).Exec(ctx)
	default:
		return nil, fmt.Errorf("ent: unknown SubscriptionMetis mutation op: %q", m.Op())
	}
}

// SubscriptionMoonbeamClient is a client for the SubscriptionMoonbeam schema.
type SubscriptionMoonbeamClient struct {
	config
}

// NewSubscriptionMoonbeamClient returns a client for the SubscriptionMoonbeam from the given config.
func NewSubscriptionMoonbeamClient(c config) *SubscriptionMoonbeamClient {
	return &SubscriptionMoonbeamClient{config: c}
}

// Use adds a list of mutation hooks to the hooks stack.
// A call to `Use(f, g, h)` equals to `subscriptionmoonbeam.Hooks(f(g(h())))`.
func (c *SubscriptionMoonbeamClient) Use(hooks ...Hook) {
	c.hooks.SubscriptionMoonbeam = append(c.hooks.SubscriptionMoonbeam, hooks...)
}

// Intercept adds a list of query interceptors to the interceptors stack.
// A call to `Intercept(f, g, h)` equals to `subscriptionmoonbeam.Intercept(f(g(h())))`.
func (c *SubscriptionMoonbeamClient) Intercept(interceptors ...Interceptor) {
	c.inters.SubscriptionMoonbeam = append(c.inters.SubscriptionMoonbeam, interceptors...)
}

// Create returns a builder for creating a SubscriptionMoonbeam entity.
func (c *SubscriptionMoonbeamClient) Create() *SubscriptionMoonbeamCreate {
	mutation := newSubscriptionMoonbeamMutation(c.config, OpCreate)
	return &SubscriptionMoonbeamCreate{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// CreateBulk returns a builder for creating a bulk of SubscriptionMoonbeam entities.
func (c *SubscriptionMoonbeamClient) CreateBulk(builders ...*SubscriptionMoonbeamCreate) *SubscriptionMoonbeamCreateBulk {
	return &SubscriptionMoonbeamCreateBulk{config: c.config, builders: builders}
}

// MapCreateBulk creates a bulk creation builder from the given slice. For each item in the slice, the function creates
// a builder and applies setFunc on it.
func (c *SubscriptionMoonbeamClient) MapCreateBulk(slice any, setFunc func(*SubscriptionMoonbeamCreate, int)) *SubscriptionMoonbeamCreateBulk {
	rv := reflect.ValueOf(slice)
	if rv.Kind() != reflect.Slice {
		return &SubscriptionMoonbeamCreateBulk{err: fmt.Errorf("calling to SubscriptionMoonbeamClient.MapCreateBulk with wrong type %T, need slice", slice)}
	}
	builders := make([]*SubscriptionMoonbeamCreate, rv.Len())
	for i := 0; i < rv.Len(); i++ {
		builders[i] = c.Create()
		setFunc(builders[i], i)
	}
	return &SubscriptionMoonbeamCreateBulk{config: c.config, builders: builders}
}

// Update returns an update builder for SubscriptionMoonbeam.
func (c *SubscriptionMoonbeamClient) Update() *SubscriptionMoonbeamUpdate {
	mutation := newSubscriptionMoonbeamMutation(c.config, OpUpdate)
	return &SubscriptionMoonbeamUpdate{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// UpdateOne returns an update builder for the given entity.
func (c *SubscriptionMoonbeamClient) UpdateOne(sm *SubscriptionMoonbeam) *SubscriptionMoonbeamUpdateOne {
	mutation := newSubscriptionMoonbeamMutation(c.config, OpUpdateOne, withSubscriptionMoonbeam(sm))
	return &SubscriptionMoonbeamUpdateOne{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// UpdateOneID returns an update builder for the given id.
func (c *SubscriptionMoonbeamClient) UpdateOneID(id int) *SubscriptionMoonbeamUpdateOne {
	mutation := newSubscriptionMoonbeamMutation(c.config, OpUpdateOne, withSubscriptionMoonbeamID(id))
	return &SubscriptionMoonbeamUpdateOne{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// Delete returns a delete builder for SubscriptionMoonbeam.
func (c *SubscriptionMoonbeamClient) Delete() *SubscriptionMoonbeamDelete {
	mutation := newSubscriptionMoonbeamMutation(c.config, OpDelete)
	return &SubscriptionMoonbeamDelete{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// DeleteOne returns a builder for deleting the given entity.
func (c *SubscriptionMoonbeamClient) DeleteOne(sm *SubscriptionMoonbeam) *SubscriptionMoonbeamDeleteOne {
	return c.DeleteOneID(sm.ID)
}

// DeleteOneID returns a builder for deleting the given entity by its id.
func (c *SubscriptionMoonbeamClient) DeleteOneID(id int) *SubscriptionMoonbeamDeleteOne {
	builder := c.Delete().Where(subscriptionmoonbeam.ID(id))
	builder.mutation.id = &id
	builder.mutation.op = OpDeleteOne
	return &SubscriptionMoonbeamDeleteOne{builder}
}

// Query returns a query builder for SubscriptionMoonbeam.
func (c *SubscriptionMoonbeamClient) Query() *SubscriptionMoonbeamQuery {
	return &SubscriptionMoonbeamQuery{
		config: c.config,
		ctx:    &QueryContext{Type: TypeSubscriptionMoonbeam},
		inters: c.Interceptors(),
	}
}

// Get returns a SubscriptionMoonbeam entity by its id.
func (c *SubscriptionMoonbeamClient) Get(ctx context.Context, id int) (*SubscriptionMoonbeam, error) {
	return c.Query().Where(subscriptionmoonbeam.ID(id)).Only(ctx)
}

// GetX is like Get, but panics if an error occurs.
func (c *SubscriptionMoonbeamClient) GetX(ctx context.Context, id int) *SubscriptionMoonbeam {
	obj, err := c.Get(ctx, id)
	if err != nil {
		panic(err)
	}
	return obj
}

// Hooks returns the client hooks.
func (c *SubscriptionMoonbeamClient) Hooks() []Hook {
	return c.hooks.SubscriptionMoonbeam
}

// Interceptors returns the client interceptors.
func (c *SubscriptionMoonbeamClient) Interceptors() []Interceptor {
	return c.inters.SubscriptionMoonbeam
}

func (c *SubscriptionMoonbeamClient) mutate(ctx context.Context, m *SubscriptionMoonbeamMutation) (Value, error) {
	switch m.Op() {
	case OpCreate:
		return (&SubscriptionMoonbeamCreate{config: c.config, hooks: c.Hooks(), mutation: m}).Save(ctx)
	case OpUpdate:
		return (&SubscriptionMoonbeamUpdate{config: c.config, hooks: c.Hooks(), mutation: m}).Save(ctx)
	case OpUpdateOne:
		return (&SubscriptionMoonbeamUpdateOne{config: c.config, hooks: c.Hooks(), mutation: m}).Save(ctx)
	case OpDelete, OpDeleteOne:
		return (&SubscriptionMoonbeamDelete{config: c.config, hooks: c.Hooks(), mutation: m}).Exec(ctx)
	default:
		return nil, fmt.Errorf("ent: unknown SubscriptionMoonbeam mutation op: %q", m.Op())
	}
}

// SubscriptionZkEVMClient is a client for the SubscriptionZkEVM schema.
type SubscriptionZkEVMClient struct {
	config
}

// NewSubscriptionZkEVMClient returns a client for the SubscriptionZkEVM from the given config.
func NewSubscriptionZkEVMClient(c config) *SubscriptionZkEVMClient {
	return &SubscriptionZkEVMClient{config: c}
}

// Use adds a list of mutation hooks to the hooks stack.
// A call to `Use(f, g, h)` equals to `subscriptionzkevm.Hooks(f(g(h())))`.
func (c *SubscriptionZkEVMClient) Use(hooks ...Hook) {
	c.hooks.SubscriptionZkEVM = append(c.hooks.SubscriptionZkEVM, hooks...)
}

// Intercept adds a list of query interceptors to the interceptors stack.
// A call to `Intercept(f, g, h)` equals to `subscriptionzkevm.Intercept(f(g(h())))`.
func (c *SubscriptionZkEVMClient) Intercept(interceptors ...Interceptor) {
	c.inters.SubscriptionZkEVM = append(c.inters.SubscriptionZkEVM, interceptors...)
}

// Create returns a builder for creating a SubscriptionZkEVM entity.
func (c *SubscriptionZkEVMClient) Create() *SubscriptionZkEVMCreate {
	mutation := newSubscriptionZkEVMMutation(c.config, OpCreate)
	return &SubscriptionZkEVMCreate{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// CreateBulk returns a builder for creating a bulk of SubscriptionZkEVM entities.
func (c *SubscriptionZkEVMClient) CreateBulk(builders ...*SubscriptionZkEVMCreate) *SubscriptionZkEVMCreateBulk {
	return &SubscriptionZkEVMCreateBulk{config: c.config, builders: builders}
}

// MapCreateBulk creates a bulk creation builder from the given slice. For each item in the slice, the function creates
// a builder and applies setFunc on it.
func (c *SubscriptionZkEVMClient) MapCreateBulk(slice any, setFunc func(*SubscriptionZkEVMCreate, int)) *SubscriptionZkEVMCreateBulk {
	rv := reflect.ValueOf(slice)
	if rv.Kind() != reflect.Slice {
		return &SubscriptionZkEVMCreateBulk{err: fmt.Errorf("calling to SubscriptionZkEVMClient.MapCreateBulk with wrong type %T, need slice", slice)}
	}
	builders := make([]*SubscriptionZkEVMCreate, rv.Len())
	for i := 0; i < rv.Len(); i++ {
		builders[i] = c.Create()
		setFunc(builders[i], i)
	}
	return &SubscriptionZkEVMCreateBulk{config: c.config, builders: builders}
}

// Update returns an update builder for SubscriptionZkEVM.
func (c *SubscriptionZkEVMClient) Update() *SubscriptionZkEVMUpdate {
	mutation := newSubscriptionZkEVMMutation(c.config, OpUpdate)
	return &SubscriptionZkEVMUpdate{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// UpdateOne returns an update builder for the given entity.
func (c *SubscriptionZkEVMClient) UpdateOne(sze *SubscriptionZkEVM) *SubscriptionZkEVMUpdateOne {
	mutation := newSubscriptionZkEVMMutation(c.config, OpUpdateOne, withSubscriptionZkEVM(sze))
	return &SubscriptionZkEVMUpdateOne{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// UpdateOneID returns an update builder for the given id.
func (c *SubscriptionZkEVMClient) UpdateOneID(id int) *SubscriptionZkEVMUpdateOne {
	mutation := newSubscriptionZkEVMMutation(c.config, OpUpdateOne, withSubscriptionZkEVMID(id))
	return &SubscriptionZkEVMUpdateOne{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// Delete returns a delete builder for SubscriptionZkEVM.
func (c *SubscriptionZkEVMClient) Delete() *SubscriptionZkEVMDelete {
	mutation := newSubscriptionZkEVMMutation(c.config, OpDelete)
	return &SubscriptionZkEVMDelete{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// DeleteOne returns a builder for deleting the given entity.
func (c *SubscriptionZkEVMClient) DeleteOne(sze *SubscriptionZkEVM) *SubscriptionZkEVMDeleteOne {
	return c.DeleteOneID(sze.ID)
}

// DeleteOneID returns a builder for deleting the given entity by its id.
func (c *SubscriptionZkEVMClient) DeleteOneID(id int) *SubscriptionZkEVMDeleteOne {
	builder := c.Delete().Where(subscriptionzkevm.ID(id))
	builder.mutation.id = &id
	builder.mutation.op = OpDeleteOne
	return &SubscriptionZkEVMDeleteOne{builder}
}

// Query returns a query builder for SubscriptionZkEVM.
func (c *SubscriptionZkEVMClient) Query() *SubscriptionZkEVMQuery {
	return &SubscriptionZkEVMQuery{
		config: c.config,
		ctx:    &QueryContext{Type: TypeSubscriptionZkEVM},
		inters: c.Interceptors(),
	}
}

// Get returns a SubscriptionZkEVM entity by its id.
func (c *SubscriptionZkEVMClient) Get(ctx context.Context, id int) (*SubscriptionZkEVM, error) {
	return c.Query().Where(subscriptionzkevm.ID(id)).Only(ctx)
}

// GetX is like Get, but panics if an error occurs.
func (c *SubscriptionZkEVMClient) GetX(ctx context.Context, id int) *SubscriptionZkEVM {
	obj, err := c.Get(ctx, id)
	if err != nil {
		panic(err)
	}
	return obj
}

// Hooks returns the client hooks.
func (c *SubscriptionZkEVMClient) Hooks() []Hook {
	return c.hooks.SubscriptionZkEVM
}

// Interceptors returns the client interceptors.
func (c *SubscriptionZkEVMClient) Interceptors() []Interceptor {
	return c.inters.SubscriptionZkEVM
}

func (c *SubscriptionZkEVMClient) mutate(ctx context.Context, m *SubscriptionZkEVMMutation) (Value, error) {
	switch m.Op() {
	case OpCreate:
		return (&SubscriptionZkEVMCreate{config: c.config, hooks: c.Hooks(), mutation: m}).Save(ctx)
	case OpUpdate:
		return (&SubscriptionZkEVMUpdate{config: c.config, hooks: c.Hooks(), mutation: m}).Save(ctx)
	case OpUpdateOne:
		return (&SubscriptionZkEVMUpdateOne{config: c.config, hooks: c.Hooks(), mutation: m}).Save(ctx)
	case OpDelete, OpDeleteOne:
		return (&SubscriptionZkEVMDelete{config: c.config, hooks: c.Hooks(), mutation: m}).Exec(ctx)
	default:
		return nil, fmt.Errorf("ent: unknown SubscriptionZkEVM mutation op: %q", m.Op())
	}
}

// UserClient is a client for the User schema.
type UserClient struct {
	config
}

// NewUserClient returns a client for the User from the given config.
func NewUserClient(c config) *UserClient {
	return &UserClient{config: c}
}

// Use adds a list of mutation hooks to the hooks stack.
// A call to `Use(f, g, h)` equals to `user.Hooks(f(g(h())))`.
func (c *UserClient) Use(hooks ...Hook) {
	c.hooks.User = append(c.hooks.User, hooks...)
}

// Intercept adds a list of query interceptors to the interceptors stack.
// A call to `Intercept(f, g, h)` equals to `user.Intercept(f(g(h())))`.
func (c *UserClient) Intercept(interceptors ...Interceptor) {
	c.inters.User = append(c.inters.User, interceptors...)
}

// Create returns a builder for creating a User entity.
func (c *UserClient) Create() *UserCreate {
	mutation := newUserMutation(c.config, OpCreate)
	return &UserCreate{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// CreateBulk returns a builder for creating a bulk of User entities.
func (c *UserClient) CreateBulk(builders ...*UserCreate) *UserCreateBulk {
	return &UserCreateBulk{config: c.config, builders: builders}
}

// MapCreateBulk creates a bulk creation builder from the given slice. For each item in the slice, the function creates
// a builder and applies setFunc on it.
func (c *UserClient) MapCreateBulk(slice any, setFunc func(*UserCreate, int)) *UserCreateBulk {
	rv := reflect.ValueOf(slice)
	if rv.Kind() != reflect.Slice {
		return &UserCreateBulk{err: fmt.Errorf("calling to UserClient.MapCreateBulk with wrong type %T, need slice", slice)}
	}
	builders := make([]*UserCreate, rv.Len())
	for i := 0; i < rv.Len(); i++ {
		builders[i] = c.Create()
		setFunc(builders[i], i)
	}
	return &UserCreateBulk{config: c.config, builders: builders}
}

// Update returns an update builder for User.
func (c *UserClient) Update() *UserUpdate {
	mutation := newUserMutation(c.config, OpUpdate)
	return &UserUpdate{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// UpdateOne returns an update builder for the given entity.
func (c *UserClient) UpdateOne(u *User) *UserUpdateOne {
	mutation := newUserMutation(c.config, OpUpdateOne, withUser(u))
	return &UserUpdateOne{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// UpdateOneID returns an update builder for the given id.
func (c *UserClient) UpdateOneID(id int) *UserUpdateOne {
	mutation := newUserMutation(c.config, OpUpdateOne, withUserID(id))
	return &UserUpdateOne{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// Delete returns a delete builder for User.
func (c *UserClient) Delete() *UserDelete {
	mutation := newUserMutation(c.config, OpDelete)
	return &UserDelete{config: c.config, hooks: c.Hooks(), mutation: mutation}
}

// DeleteOne returns a builder for deleting the given entity.
func (c *UserClient) DeleteOne(u *User) *UserDeleteOne {
	return c.DeleteOneID(u.ID)
}

// DeleteOneID returns a builder for deleting the given entity by its id.
func (c *UserClient) DeleteOneID(id int) *UserDeleteOne {
	builder := c.Delete().Where(user.ID(id))
	builder.mutation.id = &id
	builder.mutation.op = OpDeleteOne
	return &UserDeleteOne{builder}
}

// Query returns a query builder for User.
func (c *UserClient) Query() *UserQuery {
	return &UserQuery{
		config: c.config,
		ctx:    &QueryContext{Type: TypeUser},
		inters: c.Interceptors(),
	}
}

// Get returns a User entity by its id.
func (c *UserClient) Get(ctx context.Context, id int) (*User, error) {
	return c.Query().Where(user.ID(id)).Only(ctx)
}

// GetX is like Get, but panics if an error occurs.
func (c *UserClient) GetX(ctx context.Context, id int) *User {
	obj, err := c.Get(ctx, id)
	if err != nil {
		panic(err)
	}
	return obj
}

// Hooks returns the client hooks.
func (c *UserClient) Hooks() []Hook {
	return c.hooks.User
}

// Interceptors returns the client interceptors.
func (c *UserClient) Interceptors() []Interceptor {
	return c.inters.User
}

func (c *UserClient) mutate(ctx context.Context, m *UserMutation) (Value, error) {
	switch m.Op() {
	case OpCreate:
		return (&UserCreate{config: c.config, hooks: c.Hooks(), mutation: m}).Save(ctx)
	case OpUpdate:
		return (&UserUpdate{config: c.config, hooks: c.Hooks(), mutation: m}).Save(ctx)
	case OpUpdateOne:
		return (&UserUpdateOne{config: c.config, hooks: c.Hooks(), mutation: m}).Save(ctx)
	case OpDelete, OpDeleteOne:
		return (&UserDelete{config: c.config, hooks: c.Hooks(), mutation: m}).Exec(ctx)
	default:
		return nil, fmt.Errorf("ent: unknown User mutation op: %q", m.Op())
	}
}

// hooks and interceptors per client, for fast access.
type (
	hooks struct {
		Model, Subscription, SubscriptionMetis, SubscriptionMoonbeam, SubscriptionZkEVM,
		User []ent.Hook
	}
	inters struct {
		Model, Subscription, SubscriptionMetis, SubscriptionMoonbeam, SubscriptionZkEVM,
		User []ent.Interceptor
	}
)
