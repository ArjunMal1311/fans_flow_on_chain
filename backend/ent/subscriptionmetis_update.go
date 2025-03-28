// Code generated by ent, DO NOT EDIT.

package ent

import (
	"arjunmal1311/fans_flow_on_chain/backend/ent/predicate"
	"arjunmal1311/fans_flow_on_chain/backend/ent/subscriptionmetis"
	"context"
	"errors"
	"fmt"

	"entgo.io/ent/dialect/sql"
	"entgo.io/ent/dialect/sql/sqlgraph"
	"entgo.io/ent/schema/field"
)

// SubscriptionMetisUpdate is the builder for updating SubscriptionMetis entities.
type SubscriptionMetisUpdate struct {
	config
	hooks    []Hook
	mutation *SubscriptionMetisMutation
}

// Where appends a list predicates to the SubscriptionMetisUpdate builder.
func (smu *SubscriptionMetisUpdate) Where(ps ...predicate.SubscriptionMetis) *SubscriptionMetisUpdate {
	smu.mutation.Where(ps...)
	return smu
}

// Mutation returns the SubscriptionMetisMutation object of the builder.
func (smu *SubscriptionMetisUpdate) Mutation() *SubscriptionMetisMutation {
	return smu.mutation
}

// Save executes the query and returns the number of nodes affected by the update operation.
func (smu *SubscriptionMetisUpdate) Save(ctx context.Context) (int, error) {
	return withHooks(ctx, smu.sqlSave, smu.mutation, smu.hooks)
}

// SaveX is like Save, but panics if an error occurs.
func (smu *SubscriptionMetisUpdate) SaveX(ctx context.Context) int {
	affected, err := smu.Save(ctx)
	if err != nil {
		panic(err)
	}
	return affected
}

// Exec executes the query.
func (smu *SubscriptionMetisUpdate) Exec(ctx context.Context) error {
	_, err := smu.Save(ctx)
	return err
}

// ExecX is like Exec, but panics if an error occurs.
func (smu *SubscriptionMetisUpdate) ExecX(ctx context.Context) {
	if err := smu.Exec(ctx); err != nil {
		panic(err)
	}
}

func (smu *SubscriptionMetisUpdate) sqlSave(ctx context.Context) (n int, err error) {
	_spec := sqlgraph.NewUpdateSpec(subscriptionmetis.Table, subscriptionmetis.Columns, sqlgraph.NewFieldSpec(subscriptionmetis.FieldID, field.TypeInt))
	if ps := smu.mutation.predicates; len(ps) > 0 {
		_spec.Predicate = func(selector *sql.Selector) {
			for i := range ps {
				ps[i](selector)
			}
		}
	}
	if n, err = sqlgraph.UpdateNodes(ctx, smu.driver, _spec); err != nil {
		if _, ok := err.(*sqlgraph.NotFoundError); ok {
			err = &NotFoundError{subscriptionmetis.Label}
		} else if sqlgraph.IsConstraintError(err) {
			err = &ConstraintError{msg: err.Error(), wrap: err}
		}
		return 0, err
	}
	smu.mutation.done = true
	return n, nil
}

// SubscriptionMetisUpdateOne is the builder for updating a single SubscriptionMetis entity.
type SubscriptionMetisUpdateOne struct {
	config
	fields   []string
	hooks    []Hook
	mutation *SubscriptionMetisMutation
}

// Mutation returns the SubscriptionMetisMutation object of the builder.
func (smuo *SubscriptionMetisUpdateOne) Mutation() *SubscriptionMetisMutation {
	return smuo.mutation
}

// Where appends a list predicates to the SubscriptionMetisUpdate builder.
func (smuo *SubscriptionMetisUpdateOne) Where(ps ...predicate.SubscriptionMetis) *SubscriptionMetisUpdateOne {
	smuo.mutation.Where(ps...)
	return smuo
}

// Select allows selecting one or more fields (columns) of the returned entity.
// The default is selecting all fields defined in the entity schema.
func (smuo *SubscriptionMetisUpdateOne) Select(field string, fields ...string) *SubscriptionMetisUpdateOne {
	smuo.fields = append([]string{field}, fields...)
	return smuo
}

// Save executes the query and returns the updated SubscriptionMetis entity.
func (smuo *SubscriptionMetisUpdateOne) Save(ctx context.Context) (*SubscriptionMetis, error) {
	return withHooks(ctx, smuo.sqlSave, smuo.mutation, smuo.hooks)
}

// SaveX is like Save, but panics if an error occurs.
func (smuo *SubscriptionMetisUpdateOne) SaveX(ctx context.Context) *SubscriptionMetis {
	node, err := smuo.Save(ctx)
	if err != nil {
		panic(err)
	}
	return node
}

// Exec executes the query on the entity.
func (smuo *SubscriptionMetisUpdateOne) Exec(ctx context.Context) error {
	_, err := smuo.Save(ctx)
	return err
}

// ExecX is like Exec, but panics if an error occurs.
func (smuo *SubscriptionMetisUpdateOne) ExecX(ctx context.Context) {
	if err := smuo.Exec(ctx); err != nil {
		panic(err)
	}
}

func (smuo *SubscriptionMetisUpdateOne) sqlSave(ctx context.Context) (_node *SubscriptionMetis, err error) {
	_spec := sqlgraph.NewUpdateSpec(subscriptionmetis.Table, subscriptionmetis.Columns, sqlgraph.NewFieldSpec(subscriptionmetis.FieldID, field.TypeInt))
	id, ok := smuo.mutation.ID()
	if !ok {
		return nil, &ValidationError{Name: "id", err: errors.New(`ent: missing "SubscriptionMetis.id" for update`)}
	}
	_spec.Node.ID.Value = id
	if fields := smuo.fields; len(fields) > 0 {
		_spec.Node.Columns = make([]string, 0, len(fields))
		_spec.Node.Columns = append(_spec.Node.Columns, subscriptionmetis.FieldID)
		for _, f := range fields {
			if !subscriptionmetis.ValidColumn(f) {
				return nil, &ValidationError{Name: f, err: fmt.Errorf("ent: invalid field %q for query", f)}
			}
			if f != subscriptionmetis.FieldID {
				_spec.Node.Columns = append(_spec.Node.Columns, f)
			}
		}
	}
	if ps := smuo.mutation.predicates; len(ps) > 0 {
		_spec.Predicate = func(selector *sql.Selector) {
			for i := range ps {
				ps[i](selector)
			}
		}
	}
	_node = &SubscriptionMetis{config: smuo.config}
	_spec.Assign = _node.assignValues
	_spec.ScanValues = _node.scanValues
	if err = sqlgraph.UpdateNode(ctx, smuo.driver, _spec); err != nil {
		if _, ok := err.(*sqlgraph.NotFoundError); ok {
			err = &NotFoundError{subscriptionmetis.Label}
		} else if sqlgraph.IsConstraintError(err) {
			err = &ConstraintError{msg: err.Error(), wrap: err}
		}
		return nil, err
	}
	smuo.mutation.done = true
	return _node, nil
}
