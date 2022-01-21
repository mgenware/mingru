package da

import "github.com/mgenware/mingru-go-lib"

// TableTypeGhost ...
type TableTypeGhost struct {
}

// Ghost ...
var Ghost = &TableTypeGhost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypeGhost) MingruSQLName() string {
	return "ghost"
}

// ------------ Actions ------------

// InsertT ...
func (mrTable *TableTypeGhost) InsertT(queryable mingru.Queryable, fk uint64) error {
	_, err := queryable.Exec("INSERT INTO `cols` (`fk`, `text`, `int`, `nullable`, `def_int`, `def_var_char`, `def_time`) VALUES (?, '', 0, NULL, -3, '一二', CURTIME())", fk)
	return err
}

// GhostTableSelectTResult ...
type GhostTableSelectTResult struct {
	ID    uint64
	Title string
}

// SelectT ...
func (mrTable *TableTypeGhost) SelectT(queryable mingru.Queryable) ([]GhostTableSelectTResult, error) {
	rows, err := queryable.Query("SELECT `id`, `title` FROM `db_post` ORDER BY `id`")
	if err != nil {
		return nil, err
	}
	var result []GhostTableSelectTResult
	defer rows.Close()
	for rows.Next() {
		var item GhostTableSelectTResult
		err = rows.Scan(&item.ID, &item.Title)
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
