package da

import "github.com/mgenware/mingru-go-lib"

// TableTypeMyTable ...
type TableTypeMyTable struct {
}

// MyTable ...
var MyTable = &TableTypeMyTable{}

// ------------ Actions ------------

// MyTableTableSelectTResult ...
type MyTableTableSelectTResult struct {
	MyID      uint64
	my___name string
}

// SelectT ...
func (da *TableTypeMyTable) SelectT(queryable mingru.Queryable) ([]*MyTableTableSelectTResult, error) {
	rows, err := queryable.Query("SELECT `my_id`, `my_name` FROM `my_table` ORDER BY `id`")
	if err != nil {
		return nil, err
	}
	result := make([]*MyTableTableSelectTResult, 0)
	defer rows.Close()
	for rows.Next() {
		item := &MyTableTableSelectTResult{}
		err = rows.Scan(&item.MyID, &item.my___name)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return result, nil
}
