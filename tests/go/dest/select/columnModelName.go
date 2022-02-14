package da

import "github.com/mgenware/mingru-go-lib"

type TableTypeMyTable struct {
}

var MyTable = &TableTypeMyTable{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypeMyTable) MingruSQLName() string {
	return "my_table"
}

// ------------ Actions ------------

type MyTableTableSelectTResult struct {
	MyName string
	MyID   uint64
}

func (mrTable *TableTypeMyTable) SelectT(mrQueryable mingru.Queryable) ([]MyTableTableSelectTResult, error) {
	rows, err := mrQueryable.Query("SELECT `my_id`, `my_name` FROM `my_table` ORDER BY `id`")
	if err != nil {
		return nil, err
	}
	var result []MyTableTableSelectTResult
	defer rows.Close()
	for rows.Next() {
		var item MyTableTableSelectTResult
		err = rows.Scan(&item.MyID, &item.MyName)
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
